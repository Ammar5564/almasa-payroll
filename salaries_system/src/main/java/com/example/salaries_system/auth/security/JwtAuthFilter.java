// package com.example.salaries_system.auth.security;

// import java.io.IOException;
// import java.util.List;

// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.authority.SimpleGrantedAuthority;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.stereotype.Component;
// import org.springframework.web.filter.OncePerRequestFilter;

// import io.jsonwebtoken.Claims;
// import io.jsonwebtoken.Jws;
// import io.jsonwebtoken.Jwts;
// import jakarta.servlet.FilterChain;
// import jakarta.servlet.ServletException;
// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;

// @Component
// public class JwtAuthFilter extends OncePerRequestFilter {

//     private final JwtService jwtService;

//     public JwtAuthFilter(JwtService jwtService) {
//         this.jwtService = jwtService;
//     }

//     @Override
//     protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
//             throws ServletException, IOException {

//         String auth = request.getHeader("Authorization");
//         if (auth != null && auth.startsWith("Bearer ")) {
//             String token = auth.substring(7);
//             try {
//                 Jws<Claims> jws = Jwts.parser()
//                         .verifyWith(jwtService.key())
//                         .build()
//                         .parseSignedClaims(token);

//                 Claims c = jws.getPayload();
//                 String username = c.getSubject();
//                 String role = c.get("role", String.class);
//                 if (role == null || role.isBlank()) role = "ROLE_USER";

//                 UsernamePasswordAuthenticationToken authentication =
//                         new UsernamePasswordAuthenticationToken(username, null, List.of(new SimpleGrantedAuthority(role)));
//                 SecurityContextHolder.getContext().setAuthentication(authentication);
//             } catch (Exception ignored) {
//                 // Invalid token -> treat as unauthenticated
//                 SecurityContextHolder.clearContext();
//             }
//         }

//         filterChain.doFilter(request, response);
//     }
// }


//----------------------------------------------------------------------


package com.example.salaries_system.auth.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String auth = request.getHeader("Authorization");

        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);

            try {
                Jws<Claims> jws = Jwts.parser()
                        .verifyWith(jwtService.key())
                        .build()
                        .parseSignedClaims(token);

                Claims c = jws.getPayload();
                String username = c.getSubject();
                String role = c.get("role", String.class);

                if (role == null || role.isBlank()) {
                    role = "ROLE_USER";
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(new SimpleGrantedAuthority(role))
                        );

                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                // token invalid → نخلي request unauthenticated بس من غير crash
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}