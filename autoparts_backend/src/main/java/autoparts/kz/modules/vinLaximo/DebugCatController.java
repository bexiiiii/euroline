package autoparts.kz.modules.vinLaximo;


import autoparts.kz.modules.vinLaximo.client.LaximoSoapClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cat/_debug")
public class DebugCatController {

    private final LaximoSoapClient soap;

    public DebugCatController(LaximoSoapClient soap) { this.soap = soap; }

    /** ⚠️ ТОЛЬКО ДЛЯ ОТЛАДКИ. Возвращает ПОЛНЫЙ SOAP XML без обработки. */
    @GetMapping(value = "/raw", produces = MediaType.TEXT_XML_VALUE)
    public ResponseEntity<String> raw(@RequestParam String cmd) {
        // пример cmd: ListCatalogs:Locale=ru_RU
        String rawSoap = soap.execCommandsRaw(List.of(cmd));
        return ResponseEntity.ok(rawSoap);
    }
}
