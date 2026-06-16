package finora.ai.app.service;

import finora.ai.app.model.DTO.response.GoalResponseDTO;
import finora.ai.app.model.DTO.response.TransactionResponseDTO;
import finora.ai.app.model.Goals;
import finora.ai.app.model.Transactions;
import finora.ai.app.model.User;
import finora.ai.app.model.UserDetails;
import finora.ai.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(String username, String email, String password,
                             String country, String job, Long savings,
                             Long lunaryIncome, Long lunaryOutcome) {

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));

        UserDetails userDetails = new UserDetails();
        userDetails.setCountry(country);
        userDetails.setJob(job);
        userDetails.setSavings(savings);
        userDetails.setLunaryIncome(lunaryIncome);
        userDetails.setLunaryOutcome(lunaryOutcome);
        userDetails.setUser(user);

        user.setUserDetails(userDetails);

        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true) // <--- ДОБАВЬТЕ ЭТУ АННОТАЦИЮ
    public org.springframework.security.core.userdetails.UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        if (user.getUserDetails() != null) {
            user.getUserDetails().getId();
        }

        List<SimpleGrantedAuthority> authorities = user.getRoles() != null
                ? user.getRoles().stream()
                  .map(ur -> new SimpleGrantedAuthority("ROLE_" + ur.getRole().name()))
                  .collect(Collectors.toList())
                : new ArrayList<>();

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserProfileData(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("username", user.getUsername());
        body.put("email", user.getEmail());

        if (user.getUserDetails() != null) {
            body.put("job", user.getUserDetails().getJob());
            body.put("country", user.getUserDetails().getCountry());
            body.put("baseIncome", user.getUserDetails().getLunaryIncome());
            body.put("baseExpenses", user.getUserDetails().getLunaryOutcome());
            body.put("baseSavings", user.getUserDetails().getSavings());
        } else {
            body.put("job", "NOT_SPECIFIED");
            body.put("country", "NOT_SPECIFIED");
            body.put("baseIncome", 25000L);
            body.put("baseExpenses", 12000L);
            body.put("baseSavings", 5000L);
        }

        List<GoalResponseDTO> goalDTOs = new ArrayList<>();
        if (user.getGoals() != null) {
            for (Goals g : user.getGoals()) {
                GoalResponseDTO d = new GoalResponseDTO();
                d.setId(g.getId());
                d.setName(g.getGoalName());
                d.setTarget(g.getPrice());
                d.setSaved(g.getNacopleno());
                goalDTOs.add(d);
            }
        }

        List<TransactionResponseDTO> txDTOs = new ArrayList<>();
        if (user.getTransactions() != null) {
            for (Transactions t : user.getTransactions()) {
                TransactionResponseDTO d = new TransactionResponseDTO();
                d.setId(t.getId());
                d.setType(t.getTypeOfTransaction());
                d.setCategory(t.getCategory());
                d.setAmount(t.getTransactionAmount());
                d.setDate(t.getDate());
                txDTOs.add(d);
            }
        }

        body.put("goals", goalDTOs);
        body.put("transactions", txDTOs);

        return body;
    }

}
