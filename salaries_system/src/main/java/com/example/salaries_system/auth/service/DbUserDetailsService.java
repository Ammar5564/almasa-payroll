package com.example.salaries_system.auth.service;

import com.example.salaries_system.auth.model.AppUser;
import com.example.salaries_system.auth.repository.AppUserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DbUserDetailsService implements UserDetailsService {

    private final AppUserRepository repo;

    public DbUserDetailsService(AppUserRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser u = repo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!Boolean.TRUE.equals(u.getActive())) {
            throw new UsernameNotFoundException("User inactive");
        }

        String role = "ROLE_" + u.getRole().name();
        return new User(u.getUsername(), u.getPasswordHash(), List.of(new SimpleGrantedAuthority(role)));
    }
}

