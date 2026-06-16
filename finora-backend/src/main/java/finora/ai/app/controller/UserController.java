package finora.ai.app.controller;

import finora.ai.app.model.User;
import finora.ai.app.model.Goals;
import finora.ai.app.model.Transactions;
import finora.ai.app.model.DTO.response.UserProfileResponse;
import finora.ai.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional; // Импорт добавлен
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UserController {

    @Autowired
    private UserService userService;

    // 1. GET /api/users/profile - Получение детального профиля из БД в долларах ($)
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true) // Открывает сессию Hibernate на время всего запроса
    public ResponseEntity<?> getProfile(Principal principal) {
        try {
            User user = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            UserProfileResponse response = new UserProfileResponse();
            response.setUsername(user.getUsername());
            response.setEmail(user.getEmail());

            if (user.getUserDetails() != null) {
                response.setCountry(user.getUserDetails().getCountry());
                response.setJob(user.getUserDetails().getJob());
                response.setSavings(user.getUserDetails().getSavings());
                response.setLunaryIncome(user.getUserDetails().getLunaryIncome());
                response.setLunaryOutcome(user.getUserDetails().getLunaryOutcome());
            }

            // Маппинг целей в плоские Map для защиты от бесконечной рекурсии и DTO-совместимости
            List<Map<String, Object>> goalList = new ArrayList<>();
            if (user.getGoals() != null) {
                for (Goals g : user.getGoals()) {
                    Map<String, Object> d = new HashMap<>();
                    d.put("id", g.getId());
                    d.put("name", g.getGoalName());      // Конвертируем goalName в name для фронта
                    d.put("target", g.getPrice());       // Конвертируем price в target для фронта
                    d.put("saved", g.getNacopleno());    // Конвертируем nacopleno в saved для фронта
                    goalList.add(d);
                }
            }

            // Маппинг транзакций в плоские Map для защиты от бесконечной рекурсии и DTO-совместимости
            List<Map<String, Object>> txList = new ArrayList<>();
            if (user.getTransactions() != null) {
                for (Transactions t : user.getTransactions()) {
                    Map<String, Object> d = new HashMap<>();
                    d.put("id", t.getId());
                    d.put("type", t.getTypeOfTransaction());   // Конвертируем typeOfTransaction в type для фронта
                    d.put("category", t.getCategory());
                    d.put("amount", t.getTransactionAmount()); // Конвертируем transactionAmount в amount для фронта
                    d.put("date", t.getDate());
                    txList.add(d);
                }
            }

            Map<String, Object> body = new HashMap<>();
            body.put("username", response.getUsername());
            body.put("email", response.getEmail());
            body.put("job", response.getJob());
            body.put("country", response.getCountry());
            body.put("baseIncome", response.getLunaryIncome());
            body.put("baseExpenses", response.getLunaryOutcome());
            body.put("baseSavings", response.getSavings());
            body.put("goals", goalList);
            body.put("transactions", txList);

            return ResponseEntity.ok(body);
        } catch (Exception e) {
            // Выводим точный лог ошибки в терминал Spring Boot для отладки
            System.err.println("ОШИБКА ДЕСЕРИАЛИЗАЦИИ ПРОФИЛЯ:");
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage());
        }
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(Principal principal, @RequestBody Map<String, Object> payload) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getUserDetails() != null) {
            user.getUserDetails().setJob((String) payload.get("job"));
            user.getUserDetails().setCountry((String) payload.get("country"));
            user.getUserDetails().setSavings(Long.valueOf(payload.get("savings").toString()));
            user.getUserDetails().setLunaryIncome(Long.valueOf(payload.get("income").toString()));
            user.getUserDetails().setLunaryOutcome(Long.valueOf(payload.get("expenses").toString()));
        }
        userService.saveUser(user);
        return ResponseEntity.ok("Profile updated successfully");
    }



}