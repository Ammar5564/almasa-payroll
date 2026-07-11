package com.example.salaries_system.common;

import com.example.salaries_system.category.model.Category;
import com.example.salaries_system.category.repository.CategoryRepository;
import com.example.salaries_system.auth.model.AppRole;
import com.example.salaries_system.auth.model.AppUser;
import com.example.salaries_system.auth.repository.AppUserRepository;
import com.example.salaries_system.worktime.model.DepartmentWorkTime;
import com.example.salaries_system.worktime.repository.DepartmentWorkTimeRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalTime;
import java.util.List;

@Configuration
public class DataSeeder {

    private static final LocalTime STANDARD_START = LocalTime.of(9, 0);
    private static final LocalTime FACTORY_START  = LocalTime.of(8, 30);
    private static final LocalTime STANDARD_END   = LocalTime.of(17, 30);

    @Bean
    public ApplicationRunner seedData(
            CategoryRepository categoryRepository,
            DepartmentWorkTimeRepository deptRepository,
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            seedCategories(categoryRepository);
            seedDepartments(deptRepository);
            seedUsers(appUserRepository, passwordEncoder);
        };
    }

    private void seedCategories(CategoryRepository repo) {
        if (repo.count() > 0) return;
        List.of(
            "الاداره العليا",
            "الاداره الماليه",
            "بوفيه وضيافه",
            "ادارة المبيعات",
            "مصنع الالومنيوم",
            "مصنع الشتر",
            "ادارة السواقين"
        ).forEach(name -> {
            Category cat = new Category();
            cat.setName(name);
            repo.save(cat);
        });
    }

    private void seedDepartments(DepartmentWorkTimeRepository repo) {
        if (repo.count() > 0) return;

        // Departments without branches
        List.of(
            "الاداره العليا",
            "الاداره الماليه",
            "بوفيه وضيافه",
            "ادارة السواقين"
        ).forEach(name -> repo.save(buildDept(name, null, STANDARD_START)));

        // Factory departments (earlier start, no branch)
        List.of("مصنع الالومنيوم", "مصنع الشتر")
            .forEach(name -> repo.save(buildDept(name, null, FACTORY_START)));

        // Sales department — 3 branches
        List.of("التجمع", "الشيخ زايد", "شيراتون")
            .forEach(branch -> repo.save(buildDept("ادارة المبيعات", branch, STANDARD_START)));
    }

    private DepartmentWorkTime buildDept(String name, String branch, LocalTime start) {
        DepartmentWorkTime d = new DepartmentWorkTime();
        d.setDepartmentName(name);
        d.setBranchName(branch);
        d.setOfficialStart(start);
        d.setOfficialEnd(STANDARD_END);
        return d;
    }

    private void seedUsers(AppUserRepository repo, PasswordEncoder encoder) {
        if (repo.count() > 0) return;

        createUser(repo, encoder, "admin",    "admin123",  AppRole.ADMIN);
        createUser(repo, encoder, "user1",    "user1pass", AppRole.USER);
        createUser(repo, encoder, "user2",    "user2pass", AppRole.USER);
        createUser(repo, encoder, "user3",    "user3pass", AppRole.USER);
    }

    private void createUser(AppUserRepository repo, PasswordEncoder encoder,
                            String username, String password, AppRole role) {
        AppUser u = new AppUser();
        u.setUsername(username);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(role);
        u.setActive(true);
        repo.save(u);
    }
}
