package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.config.AwsS3Properties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.AbortMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.model.UploadPartCopyRequest;
import software.amazon.awssdk.services.s3.model.UploadPartCopyResponse;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class S3Storage {

    private static final Logger log = LoggerFactory.getLogger(S3Storage.class);

    private final S3Client s3Client;
    private final AwsS3Properties properties;
    private final Map<String, UploadState> uploads = new ConcurrentHashMap<>();

    public S3Storage(S3Client s3Client, AwsS3Properties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
    }

    @PostConstruct
    public void ensureBucket() {
        try {
            HeadBucketResponse response = s3Client.headBucket(HeadBucketRequest.builder()
                    .bucket(properties.getBucket())
                    .build());
            log.info("Bucket {} already exists, status {}", properties.getBucket(), response.sdkHttpResponse().statusCode());
        } catch (NoSuchBucketException e) {
            log.info("Bucket {} missing, creating", properties.getBucket());
            s3Client.createBucket(CreateBucketRequest.builder()
                    .bucket(properties.getBucket())
                    .build());
        } catch (Exception ex) {
            log.warn("Skipping bucket check for {}: {}", properties.getBucket(), ex.getMessage());
        }
    }

    public void putObject(String key, byte[] data, String contentType) {
        log.info("Uploading object {} ({} bytes)", key, data.length);
        s3Client.putObject(PutObjectRequest.builder()
                        .bucket(properties.getBucket())
                        .key(key)
                        .contentType(contentType)
                        .acl(ObjectCannedACL.BUCKET_OWNER_FULL_CONTROL)
                        .build(),
                RequestBody.fromBytes(data));
    }

    public byte[] getObject(String key) {
        return getObjectResponse(key).asByteArray();
    }

    public InputStream getObjectStream(String key) {
        return new ByteArrayInputStream(getObject(key));
    }

    public ResponseBytes<GetObjectResponse> getObjectResponse(String key) {
        return s3Client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(key)
                .build());
    }

    public void deleteObject(String key) {
        try {
            s3Client.deleteObject(builder -> builder.bucket(properties.getBucket()).key(key));
        } catch (S3Exception e) {
            if (e.awsErrorDetails() != null && "NoSuchKey".equals(e.awsErrorDetails().errorCode())) {
                log.warn("S3 object {} already removed", key);
            } else {
                throw e;
            }
        }
    }

    public String publicUrl(String key) {
        String endpoint = properties.getEndpoint();
        if (endpoint.endsWith("/")) {
            endpoint = endpoint.substring(0, endpoint.length() - 1);
        }
        return endpoint + "/" + properties.getBucket() + "/" + key;
    }

    public List<S3Object> listObjects(String prefix) {
        ListObjectsV2Response response = s3Client.listObjectsV2(ListObjectsV2Request.builder()
                .bucket(properties.getBucket())
                .prefix(prefix)
                .build());
        return response.contents();
    }

    public void compose(String destinationKey, List<String> sourceKeys, String contentType) {
        if (sourceKeys.isEmpty()) {
            throw new IllegalArgumentException("sourceKeys must not be empty");
        }
        String uploadId = s3Client.createMultipartUpload(CreateMultipartUploadRequest.builder()
                .bucket(properties.getBucket())
                .key(destinationKey)
                .contentType(contentType)
                .build()).uploadId();
        List<CompletedPart> parts = new ArrayList<>();
        int partNumber = 1;
        for (String key : sourceKeys) {
            UploadPartCopyResponse response = s3Client.uploadPartCopy(UploadPartCopyRequest.builder()
                    .sourceBucket(properties.getBucket())
                    .sourceKey(key)
                    .destinationBucket(properties.getBucket())
                    .destinationKey(destinationKey)
                    .uploadId(uploadId)
                    .partNumber(partNumber)
                    .build());
            parts.add(CompletedPart.builder()
                    .partNumber(partNumber)
                    .eTag(response.copyPartResult().eTag())
                    .build());
            partNumber++;
        }
        s3Client.completeMultipartUpload(CompleteMultipartUploadRequest.builder()
                .bucket(properties.getBucket())
                .key(destinationKey)
                .multipartUpload(CompletedMultipartUpload.builder()
                        .parts(parts)
                        .build())
                .build());
    }

    public String initiateMultipartUpload(String key, String contentType) {
        UploadState state = new UploadState(key, contentType);
        UploadState existing = uploads.putIfAbsent(key, state);
        if (existing != null) {
            return existing.uploadId;
        }
        state.uploadId = s3Client.createMultipartUpload(CreateMultipartUploadRequest.builder()
                .bucket(properties.getBucket())
                .key(key)
                .contentType(contentType)
                .build()).uploadId();
        return state.uploadId;
    }

    public void uploadPart(String key, InputStream inputStream) throws IOException {
        UploadState state = requireState(key);
        byte[] bytes = inputStream.readAllBytes();
        int partNumber = state.nextPart();
        UploadPartRequest upload = UploadPartRequest.builder()
                .bucket(properties.getBucket())
                .key(key)
                .uploadId(state.uploadId)
                .partNumber(partNumber)
                .contentLength((long) bytes.length)
                .build();
        log.debug("Uploading part {} for {} ({} bytes)", partNumber, key, bytes.length);
        String eTag = s3Client.uploadPart(upload, RequestBody.fromBytes(bytes)).eTag();
        state.parts.add(CompletedPart.builder()
                .partNumber(partNumber)
                .eTag(eTag)
                .build());
    }

    public void completeMultipartUpload(String key) {
        UploadState state = uploads.remove(key);
        if (state == null) {
            return;
        }
        state.parts.sort(Comparator.comparingInt(CompletedPart::partNumber));
        s3Client.completeMultipartUpload(CompleteMultipartUploadRequest.builder()
                .bucket(properties.getBucket())
                .key(key)
                .multipartUpload(CompletedMultipartUpload.builder()
                        .parts(state.parts)
                        .build())
                .build());
    }

    public void abortMultipartUpload(String key) {
        UploadState state = uploads.remove(key);
        if (state == null) {
            return;
        }
        s3Client.abortMultipartUpload(AbortMultipartUploadRequest.builder()
                .bucket(properties.getBucket())
                .key(key)
                .uploadId(state.uploadId)
                .build());
    }

    public AwsS3Properties properties() {
        return properties;
    }

    private UploadState requireState(String key) {
        UploadState state = uploads.get(key);
        if (state == null) {
            throw new IllegalStateException("Upload " + key + " not initialised");
        }
        return state;
    }

    private static class UploadState {
        final String key;
        final String contentType;
        volatile String uploadId;
        final List<CompletedPart> parts = new ArrayList<>();
        int nextPart = 1;
        final Instant createdAt = Instant.now();

        private UploadState(String key, String contentType) {
            this.key = key;
            this.contentType = contentType;
        }

        synchronized int nextPart() {
            return nextPart++;
        }
    }
}
