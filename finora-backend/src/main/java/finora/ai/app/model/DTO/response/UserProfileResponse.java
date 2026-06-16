package finora.ai.app.model.DTO.response;


public class UserProfileResponse {
    private String username;
    private String email;
    private String country;
    private String job;
    private Long savings;
    private Long lunaryIncome;
    private Long lunaryOutcome;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getJob() {
        return job;
    }

    public void setJob(String job) {
        this.job = job;
    }

    public Long getSavings() {
        return savings;
    }

    public void setSavings(Long savings) {
        this.savings = savings;
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
}
