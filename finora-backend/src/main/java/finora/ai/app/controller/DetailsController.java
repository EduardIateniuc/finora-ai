package finora.ai.app.controller;

import finora.ai.app.model.Goals;
import finora.ai.app.model.Transactions;
import finora.ai.app.model.User;
import finora.ai.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users/details")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class DetailsController {

    @Autowired
    private UserService userService;

    @PostMapping("/goals")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addGoal(Principal principal, @RequestBody Map<String, Object> payload) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Goals goal = new Goals();
        goal.setGoalName((String) payload.get("name"));
        goal.setPrice(Long.valueOf(payload.get("target").toString()));
        goal.setNacopleno(Long.valueOf(payload.get("saved").toString()));
        goal.setUser(user);

        user.getGoals().add(goal);
        userService.saveUser(user);
        return ResponseEntity.ok("Goal added successfully");
    }

    @PostMapping("/transactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addTransaction(Principal principal, @RequestBody Map<String, Object> payload) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Transactions tx = new Transactions();
        tx.setTypeOfTransaction((String) payload.get("type"));
        tx.setCategory((String) payload.get("category"));
        tx.setTransactionAmount(Long.valueOf(payload.get("amount").toString()));
        tx.setDate((String) payload.get("date"));
        tx.setUser(user);

        user.getTransactions().add(tx);
        userService.saveUser(user);
        return ResponseEntity.ok("Transaction tracked successfully");
    }

    @DeleteMapping("/goals/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteGoal(Principal principal, @PathVariable Long id) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean removed = user.getGoals().removeIf(goal -> goal.getId().equals(id));
        if (!removed) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found");
        }
        userService.saveUser(user);
        return ResponseEntity.ok("Goal deleted successfully");
    }

    @PutMapping("/goals/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> editGoal(Principal principal, @PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Goals goal = user.getGoals().stream()
                .filter(g -> g.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        goal.setGoalName((String) payload.get("name"));
        goal.setPrice(Long.valueOf(payload.get("target").toString()));
        goal.setNacopleno(Long.valueOf(payload.get("saved").toString()));

        userService.saveUser(user);
        return ResponseEntity.ok("Goal updated successfully");
    }

    @DeleteMapping("/transactions/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteTransaction(Principal principal, @PathVariable Long id) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean removed = user.getTransactions().removeIf(tx -> tx.getId().equals(id));
        if (!removed) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Transaction not found");
        }
        userService.saveUser(user);
        return ResponseEntity.ok("Transaction deleted successfully");
    }

    @PutMapping("/transactions/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> editTransaction(Principal principal, @PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Transactions tx = user.getTransactions().stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        tx.setTypeOfTransaction((String) payload.get("type"));
        tx.setCategory((String) payload.get("category"));
        tx.setTransactionAmount(Long.valueOf(payload.get("amount").toString()));
        tx.setDate((String) payload.get("date"));

        userService.saveUser(user);
        return ResponseEntity.ok("Transaction updated successfully");
    }

}
