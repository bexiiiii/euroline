package autoparts.kz.modules.admin.importexport;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/import-export")
public class ImportExportController {

    private final ImportExportService importExportService;

    @Autowired
    public ImportExportController(ImportExportService importExportService) {
        this.importExportService = importExportService;
    }

    @PostMapping("/import")
    public ResponseEntity<String> importData(@RequestParam("file") MultipartFile file) {
        try {
            importExportService.importData(file);
            return new ResponseEntity<>("Data imported successfully", HttpStatus.OK);
        } catch (IOException e) {
            return new ResponseEntity<>("Error importing data", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportData() {
        try {
            byte[] data = importExportService.exportData();
            return ResponseEntity.ok().header("Content-Disposition", "attachment; filename=data.csv").body(data);
        } catch (IOException e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
