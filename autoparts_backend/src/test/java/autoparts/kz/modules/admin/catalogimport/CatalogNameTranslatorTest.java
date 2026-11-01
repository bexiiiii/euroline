package autoparts.kz.modules.admin.catalogimport;

import autoparts.kz.modules.admin.catalogimport.parser.CatalogNameTranslator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CatalogNameTranslatorTest {

    private final CatalogNameTranslator t = new CatalogNameTranslator();

    private String ru(String en) {
        return t.translate(en, null).name();
    }

    @Test
    void translatesTypicalLightingNames() {
        assertEquals("Фонарь задний комбинированный, для трактора, левый", ru("TRACTOR REAR COMBINATION LAMP LEFT"));
        assertEquals("Фара рабочего света светодиодная круглая, 10-30V", ru("LED ROUND WORK LAMP 10-30V"));
        assertEquals("Фонарь задний комбинированный, с разъёмом, для грузовика и прицепа, правый",
                ru("TRUCK TRAILER REAR COMBINATION LAMP WITH SOCKET RIGHT"));
        assertEquals("Фонарь задний комбинированный квадратный неоновый светодиодный, с динамическим поворотником",
                ru("DYNAMIC SINGAL SQUARE NEON LED REAR COMB. LAMP"));
    }

    @Test
    void lensAndPartsUseGenitiveAndNeuterAgreement() {
        assertEquals("Стекло переднего комбинированного фонаря 55-46, для трактора, левое",
                ru("TRACTOR FRONT COMBINATION LAMP 55-46 LENS LEFT"));
        assertEquals("Стекло заднего фонаря, для грузовика и прицепа, красно-белое",
                ru("TRUCK TRAILER REAR LAMP LENS RED-CLEAR"));
        assertEquals("Кожух фары 135-148, для трактора, правый", ru("TRACTOR HEADLIGHT COWL 135-148 RIGHT"));
        assertEquals("Фара, для трактора, чёрная", ru("TRACTOR HEADLIGHT BLACK"));
    }

    @Test
    void keepsModelNamesAndReportsThem() {
        CatalogNameTranslator.Result r = t.translate("SUPER 240 CHROME LATTICED REAR LAMP RIGHT", null);
        assertEquals("Фонарь задний хромированный SUPER 240, с защитной решёткой, правый", r.name());
        assertEquals(List.of("SUPER"), r.leftovers());
    }

    @Test
    void fallsBackToTurkishWhenNoEnglish() {
        assertEquals("Стекло переднего габаритного фонаря 275, для трактора",
                t.translate(null, "TRAKTÖR ÖN PARK LAMBA CAMI 275").name());
    }

    @Test
    void extractsVoltage() {
        assertEquals(List.of("24V"), t.translate("NEON LED HAMBURGER REAR LAMP 24 VOLTS", null).voltages());
    }
}
