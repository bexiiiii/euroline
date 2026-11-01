package autoparts.kz.modules.onecOrders;

import autoparts.kz.modules.order.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class OneCOrderDispatcherTest {
    @Test void timeoutRetainsExactPersistedCommandAndRetrySavesAcknowledgedDocument() {
        var db = mock(JdbcTemplate.class); var orders = mock(OrderRepository.class);
        var mapper = mock(OneCOrderCommandMapper.class); var client = mock(OneCOrderApiClient.class);
        var transactions = mock(PlatformTransactionManager.class);
        when(transactions.getTransaction(any())).thenAnswer(call -> new SimpleTransactionStatus());
        String id = "stable-command"; String payload = "{\"commandId\":\"stable-command\"}";
        when(db.queryForList(contains("SELECT id"),eq(String.class),any())).thenReturn(List.of(id));
        when(db.queryForList(contains("FOR UPDATE SKIP LOCKED"),eq(id)))
                .thenReturn(List.of(Map.of("aggregate_id",4L,"command_json",payload,"attempts",0)),
                        List.of(Map.of("aggregate_id",4L,"command_json",payload,"attempts",1)),
                        List.of(Map.of("aggregate_id",4L,"command_json",payload,"attempts",1)),
                        List.of(Map.of("aggregate_id",4L,"command_json",payload,"attempts",2)));
        when(client.recoverOrSend(eq(payload),isNull(),anyBoolean())).thenThrow(new ResourceAccessException("timeout")).thenReturn("document-key");
        when(db.update(contains("UPDATE orders SET onec_ref_key"),eq("document-key"),eq(4L),eq("document-key"))).thenReturn(1);
        var dispatcher = new OneCOrderDispatcher(db,orders,mapper,client,transactions,new OneCOrderProperties(),false,false);
        dispatcher.dispatch();
        verify(db).update(contains("next_attempt_at=CURRENT_TIMESTAMP"),eq("NEW"),eq(1),anyString(),eq(15),eq(id));
        verify(db,never()).update(contains("status='SENT'"),eq(id));
        dispatcher.dispatch();
        verify(client).recoverOrSend(payload,null,true);
        verify(client).recoverOrSend(payload,null,false);
        verifyNoInteractions(mapper,orders);
        verify(db).update(contains("status='SENT'"),eq(id));
        verify(db).update(contains("UPDATE orders SET onec_ref_key"),eq("document-key"),eq(4L),eq("document-key"));
    }
}
