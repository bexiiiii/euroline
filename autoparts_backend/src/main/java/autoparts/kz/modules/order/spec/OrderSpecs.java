package autoparts.kz.modules.order.spec;


import autoparts.kz.modules.order.entity.Order;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

public final class OrderSpecs {
    private OrderSpecs(){}

    public static Specification<Order> q(String q){
        return (root, cq, cb) -> {
            if (q == null || q.isBlank()) return cb.conjunction();
            String like = "%" + q.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("id").as(String.class)), like),
                    cb.like(cb.lower(root.get("customerEmail")), like),
                    cb.like(cb.lower(root.get("comment")), like)
            );
        };
    }

    public static Specification<Order> status(String s){
        return (root, cq, cb) -> (s == null || s.isBlank())
                ? cb.conjunction()
                : cb.equal(root.get("status"), s);
    }

    public static Specification<Order> paymentStatus(String s){
        return (root, cq, cb) -> (s == null || s.isBlank())
                ? cb.conjunction()
                : cb.equal(root.get("paymentStatus"), s);
    }

    public static Specification<Order> period(Instant from, Instant to){
        return (root, cq, cb) -> {
            if (from == null && to == null) return cb.conjunction();
            if (from != null && to != null) return cb.between(root.get("createdAt"), from, to);
            if (from != null) return cb.greaterThanOrEqualTo(root.get("createdAt"), from);
            return cb.lessThan(root.get("createdAt"), to);
        };
    }
}
