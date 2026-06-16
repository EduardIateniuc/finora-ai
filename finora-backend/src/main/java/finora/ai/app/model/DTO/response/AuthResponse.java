package finora.ai.app.model.DTO.response;

public class AuthResponse {
    private String token;

    // Пустой конструктор для десериализации
    public AuthResponse() {}

    public AuthResponse(String token) {
        this.token = token;
    }

    // КРИТИЧЕСКИ ВАЖНО: Без этого геттера бэкенд будет возвращать пустой JSON {}
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}