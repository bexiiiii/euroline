package autoparts.kz.modules.cml.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class ZipUtil {

    private static final Logger log = LoggerFactory.getLogger(ZipUtil.class);

    private ZipUtil() {
    }

    public static void assertWithinLimit(byte[] zipBytes, long maxBytes) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            long total = 0;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                total += drainEntry(zis);
                if (total > maxBytes) {
                    throw new IllegalStateException("Unzipped content exceeds limit of " + maxBytes + " bytes");
                }
            }
        }
    }

    public static byte[] extractEntry(byte[] zipBytes, String targetName) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().equalsIgnoreCase(targetName)) {
                    return readEntry(zis);
                }
            }
        }
        throw new IllegalArgumentException("Entry " + targetName + " not found in archive");
    }

    /**
     * Извлекает первый XML файл из архива, имя которого начинается с указанного префикса
     */
    public static byte[] extractEntryByPrefix(byte[] zipBytes, String prefix) throws IOException {
        // Сначала выведем список всех файлов в архиве
        log.info("📦 Analyzing ZIP archive contents for prefix '{}'", prefix);
        listArchiveContents(zipBytes);
        
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String entryName = entry.getName();
                // Получаем только имя файла без пути
                String fileName = entryName.contains("/") 
                    ? entryName.substring(entryName.lastIndexOf("/") + 1) 
                    : entryName;
                
                if (!entry.isDirectory() 
                    && fileName.toLowerCase().startsWith(prefix.toLowerCase())
                    && fileName.toLowerCase().endsWith(".xml")) {
                    log.info("✅ Found matching XML file: {} (full path: {})", fileName, entryName);
                    return readEntry(zis);
                }
            }
        }
        throw new IllegalArgumentException("No XML entry starting with '" + prefix + "' found in archive");
    }

    /**
     * Выводит список всех файлов в архиве
     */
    public static void listArchiveContents(byte[] zipBytes) throws IOException {
        log.info("📋 Files in ZIP archive:");
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            int count = 0;
            while ((entry = zis.getNextEntry()) != null) {
                count++;
                if (entry.isDirectory()) {
                    log.info("  📁 [DIR]  {}", entry.getName());
                } else {
                    log.info("  📄 [FILE] {} ({} bytes)", entry.getName(), entry.getSize());
                }
            }
            log.info("📊 Total entries: {}", count);
        }
    }

    private static long drainEntry(InputStream is) throws IOException {
        long total = 0;
        byte[] buffer = new byte[8192];
        int read;
        while ((read = is.read(buffer)) != -1) {
            total += read;
        }
        return total;
    }

    private static byte[] readEntry(InputStream is) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        while ((read = is.read(buffer)) != -1) {
            baos.write(buffer, 0, read);
        }
        return baos.toByteArray();
    }
}
