package com.example.salaries_system.user.model;


import jakarta.persistence.*;
import lombok.Data;
import com.example.salaries_system.user.model.Role;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;
}
