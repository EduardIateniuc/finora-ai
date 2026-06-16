package finora.ai.app.model.DTO.response;

public class GoalResponseDTO {
    private Long id;
    private String name;
    private Long target;
    private Long saved;

    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getTarget() { return target; }
    public void setTarget(Long target) { this.target = target; }
    public Long getSaved() { return saved; }
    public void setSaved(Long saved) { this.saved = saved; }
}
