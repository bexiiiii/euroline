package autoparts.kz.modules.cml.parser;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CmlImportParserTest {

    private final CmlImportParser parser = new CmlImportParser();

    @Test
    void parsesProductWithAttributes() throws Exception {
        String xml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <КоммерческаяИнформация>
                  <Каталог>
                    <Товары>
                      <Товар>
                        <Ид>prod-1</Ид>
                        <Артикул>SKU001</Артикул>
                        <Наименование>Test product</Наименование>
                        <Описание>Sample description</Описание>
                        <Группы>
                          <Ид>100</Ид>
                        </Группы>
                        <ЗначенияСвойств>
                          <ЗначенияСвойства>
                            <Ид>color</Ид>
                            <Значение>red</Значение>
                          </ЗначенияСвойства>
                        </ЗначенияСвойств>
                      </Товар>
                    </Товары>
                  </Каталог>
                </КоммерческаяИнформация>
                """;

        List<CmlImportParser.ProductRecord> records = new ArrayList<>();
        parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), 10, records::addAll);

        assertThat(records).hasSize(1);
        CmlImportParser.ProductRecord record = records.get(0);
        assertThat(record.guid()).isEqualTo("prod-1");
        assertThat(record.sku()).isEqualTo("SKU001");
        assertThat(record.categoryId()).isEqualTo(100L);
        assertThat(record.attributes()).containsEntry("color", "red");
    }
}
