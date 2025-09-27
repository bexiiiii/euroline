package autoparts.kz.modules.order.service.spec;


import autoparts.kz.modules.order.entity.Order;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

public class OrderSpecs {
    public static Specification<Order> status(String s){
        if (s==null || s.isBlank()) return null;
        return (r,c,b)-> b.equal(r.get("status"), s);
    }
    public static Specification<Order> paymentStatus(String s){
        if (s==null || s.isBlank()) return null;
        return (r,c,b)-> b.equal(r.get("paymentStatus"), s);
    }
    public static Specification<Order> period(Instant from, Instant to){
        if (from==null && to==null) return null;
        return (r,c,b)-> {
            if (from!=null && to!=null) return b.between(r.get("createdAt"), from, to);
            if (from!=null) return b.greaterThanOrEqualTo(r.get("createdAt"), from);
            return b.lessThan(r.get("createdAt"), to);
        };
    }
    public static Specification<Order> q(String q){
        if (q==null || q.isBlank()) return null;
        String like = "%"+q.toLowerCase()+"%";
        return (r,c,b)-> b.or(
                b.like(b.lower(r.get("id").as(String.class)), like),
                b.like(b.lower(r.get("customerEmail")), like),
                b.like(b.lower(r.get("comment")), like)
        );
    }
}

