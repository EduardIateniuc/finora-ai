package finora.ai.app.model;


import jakarta.persistence.*;

@Entity
@Table(name = "user_details")
public class UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long lunaryIncome;
    private Long lunaryOutcome;
    private String country;
    private Long savings;
    private String job;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLunaryIncome() {
        return lunaryIncome;
    }

    public void setLunaryIncome(Long lunaryIncome) {
        this.lunaryIncome = lunaryIncome;
    }

    public Long getLunaryOutcome() {
        return lunaryOutcome;
    }

    public void setLunaryOutcome(Long lunaryOutcome) {
        this.lunaryOutcome = lunaryOutcome;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public Long getSavings() {
        return savings;
    }

    public void setSavings(Long savings) {
        this.savings = savings;
    }

    public String getJob() {
        return job;
    }

    public void setJob(String job) {
        this.job = job;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
