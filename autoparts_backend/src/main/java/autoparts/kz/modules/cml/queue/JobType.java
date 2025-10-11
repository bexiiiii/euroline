package autoparts.kz.modules.cml.queue;

public enum JobType {
    CATALOG_UPLOAD("catalog_upload"),
    CATALOG_IMPORT("catalog.import"),
    OFFERS_IMPORT("offers.import"),
    ORDERS_EXPORT("orders.export"),
    ORDERS_APPLY("orders.apply");

    private final String routingKey;

    JobType(String routingKey) {
        this.routingKey = routingKey;
    }

    public String routingKey() {
        return routingKey;
    }
}
