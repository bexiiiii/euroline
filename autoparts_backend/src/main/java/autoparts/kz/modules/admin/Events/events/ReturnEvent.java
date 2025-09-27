package autoparts.kz.modules.admin.Events.events;


public record ReturnEvent(String type, Long returnId, Long orderId, Long userId) {}
