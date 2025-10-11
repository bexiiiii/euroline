package autoparts.kz.modules.cml.parser;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CmlOffersParserTest {

    private final CmlOffersParser parser = new CmlOffersParser();

    @Test
    void parsesOfferWithPrices() throws Exception {
        String xml = """
                <КоммерческаяИнформация>
                  <ПакетПредложений>
                    <Предложения>
                      <Предложение>
                        <Ид>prod-1</Ид>
                        <Количество>42.5</Количество>
                        <Склад>
                          <Ид>main-warehouse</Ид>
                        </Склад>
                        <Цены>
                          <Цена>
                            <ИдТипаЦены>retail</ИдТипаЦены>
                            <ЦенаЗаЕдиницу>1990.00</ЦенаЗаЕдиницу>
                            <Валюта>KZT</Валюта>
                          </Цена>
                        </Цены>
                      </Предложение>
                    </Предложения>
                  </ПакетПредложений>
                </КоммерческаяИнформация>
                """;

        List<CmlOffersParser.OfferRecord> offers = new ArrayList<>();
        parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), 10, offers::addAll);

        assertThat(offers).hasSize(1);
        CmlOffersParser.OfferRecord offer = offers.get(0);
        assertThat(offer.productGuid()).isEqualTo("prod-1");
        assertThat(offer.quantity()).isEqualByComparingTo("42.5");
        assertThat(offer.warehouseGuid()).isEqualTo("main-warehouse");
        assertThat(offer.prices()).hasSize(1);
        assertThat(offer.prices().get(0).priceTypeGuid()).isEqualTo("retail");
    }
}
