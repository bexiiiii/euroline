package autoparts.kz.modules.cml.parser;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CmlOrdersChangeParserTest {

    private final CmlOrdersChangeParser parser = new CmlOrdersChangeParser();

    @Test
    void parsesOrderChange() throws Exception {
        String xml = """
                <КоммерческаяИнформация>
                  <Документ>
                    <Ид>order-1</Ид>
                    <Номер>1001</Номер>
                    <Статус>Отгружен</Статус>
                    <Оплачен>true</Оплачен>
                  </Документ>
                </КоммерческаяИнформация>
                """;

        List<CmlOrdersChangeParser.OrderChange> changes = new ArrayList<>();
        parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), changes::add);

        assertThat(changes).hasSize(1);
        CmlOrdersChangeParser.OrderChange change = changes.get(0);
        assertThat(change.guid()).isEqualTo("order-1");
        assertThat(change.number()).isEqualTo("1001");
        assertThat(change.paid()).isTrue();
        assertThat(change.status()).isEqualTo("Отгружен");
    }
}
