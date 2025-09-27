package autoparts.kz.modules.admin.importexport;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.List;

@Service
public class ImportExportService {

    // Импорт данных из CSV
    public void importData(MultipartFile file) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withHeader())) {
            List<CSVRecord> records = csvParser.getRecords();
            for (CSVRecord record : records) {
                // Здесь можно добавить логику для сохранения данных в базу данных.
                String column1 = record.get("Column1");
                String column2 = record.get("Column2");
                // Пример импорта данных
            }
        }
    }

    // Экспорт данных в CSV
    public byte[] exportData() throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream));
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader("Column1", "Column2"))) {

            // Здесь добавляем логику для получения данных из базы данных
            List<String[]> data = getDataFromDatabase();  // Пример данных

            for (String[] row : data) {
                csvPrinter.printRecord((Object[]) row);
            }

        }
        return outputStream.toByteArray();
    }

    // Пример метода для получения данных из базы данных (это можно заменить реальной логикой)
    private List<String[]> getDataFromDatabase() {
        // Возвращаем фиктивные данные
        return List.of(
                new String[]{"Row1Column1", "Row1Column2"},
                new String[]{"Row2Column1", "Row2Column2"}
        );
    }

///  это как пример
//    // Импорт данных из CSV
//    public void importData(MultipartFile file) throws IOException {
//        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
//             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withHeader())) {
//            List<CSVRecord> records = csvParser.getRecords();
//            for (CSVRecord record : records) {
//                // Чтение данных из CSV и сохранение их в базу данных
//                String name = record.get("name");
//                String description = record.get("description");
//                double price = Double.parseDouble(record.get("price"));
//
//                Product product = new Product();
//                product.setName(name);
//                product.setDescription(description);
//                product.setPrice(price);
//
//                productRepository.save(product);  // Сохраняем в базу данных
//            }
//        }
//    }
//
//    // Экспорт данных в CSV
//    public byte[] exportData() throws IOException {
//        List<Product> products = productRepository.findAll(); // Получаем все продукты из базы данных
//
//        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
//        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream));
//             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader("ID", "Name", "Description", "Price"))) {
//
//            for (Product product : products) {
//                // Записываем данные из продукта в CSV
//                csvPrinter.printRecord(product.getId(), product.getName(), product.getDescription(), product.getPrice());
//            }
//        }
//        return outputStream.toByteArray();
//    }
}
