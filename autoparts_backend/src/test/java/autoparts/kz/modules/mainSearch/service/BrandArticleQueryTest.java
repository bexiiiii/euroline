package autoparts.kz.modules.mainSearch.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BrandArticleQueryTest {

    @Test
    void brandThenArticle() {
        var ba = MainSearchService.splitBrandAndArticle("WABCO 4410329212");
        assertNotNull(ba);
        assertEquals("WABCO", ba.brand());
        assertEquals("4410329212", ba.article());
    }

    @Test
    void articleThenBrandAndSpacedArticle() {
        assertEquals("4410329212", MainSearchService.splitBrandAndArticle("4410329212 WABCO").article());
        assertEquals("4410329212", MainSearchService.splitBrandAndArticle("WABCO 441 032 92 12").article());
        assertEquals("MERCEDES BENZ", MainSearchService.splitBrandAndArticle("MERCEDES BENZ A0004203820").brand());
    }

    @Test
    void notBrandArticle() {
        assertNull(MainSearchService.splitBrandAndArticle("4410329212"));
        assertNull(MainSearchService.splitBrandAndArticle("тормозные колодки"));
        assertNull(MainSearchService.splitBrandAndArticle("масло 5W40"));
        assertNull(MainSearchService.splitBrandAndArticle("очень длинный текстовый запрос 12345"));
    }

    @Test
    void brandHint() {
        assertTrue(MainSearchService.brandMatchesHint("WABCO", "wabco"));
        assertTrue(MainSearchService.brandMatchesHint("MERCEDES-BENZ", "MERCEDES-BENZ"));
        assertFalse(MainSearchService.brandMatchesHint("HALDEX", "WABCO"));
    }
}
