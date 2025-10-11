package autoparts.kz.modules.cml.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class ZipUtil {

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
