package com.example.sienteniumassetmanagement.User.config;


import com.example.sienteniumassetmanagement.User.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /*
     * Spring Security will use our custom service
     * to load users from the database.
     */
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(
            CustomUserDetailsService customUserDetailsService) {

        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        return http

                /*
                 * JWT APIs normally disable CSRF.
                 * CSRF protection is mainly needed
                 * for server-rendered forms.
                 */
                .csrf(AbstractHttpConfigurer::disable)

                /*
                 * We do not want Spring Security
                 * generating a login page for us.
                 *
                 * Our frontend already contains:
                 * - signIn.html
                 * - signUp.html
                 */
                .formLogin(AbstractHttpConfigurer::disable)

                /*
                 * Disable HTTP Basic authentication.
                 *
                 * We will authenticate users
                 * using JWT tokens instead.
                 */
                .httpBasic(AbstractHttpConfigurer::disable)

                /*
                 * JWT applications should be stateless.
                 *
                 * Spring must NOT create sessions.
                 * Every request will carry its own token.
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS))

                /*
                 * Access Rules
                 */
                .authorizeHttpRequests(auth -> auth

                        /*
                         * Public Pages
                         */
                        .requestMatchers(
                                "/",
                                "/signIn.html",
                                "/signUp.html"
                        ).permitAll()

                        /*
                         * Dashboard Pages (protected by frontend JWT)
                         */
                        .requestMatchers(
                                "/dashboard/**"
                        ).permitAll()

                        /*
                         * Public Static Resources
                         */
                        .requestMatchers(
                                "/styles/**",
                                "/scripts/**",
                                "/images/**",
                                "/uploads/**",
                                "/photo/**",
                               "/",
                               // "/api/upload/**",
                                "/assets/**"  //Remove this, I wanted to test only
                        ).permitAll()

                        /*
                         * Public Authentication APIs
                         */
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/upload/**",      // ← to be removed
                                "/api/assets/**",      // ← add this
                                "/swagger-ui/**",      // ← add this
                                "/v3/api-docs/**",
                                "/error", // ← add this
                                "/swagger-ui.html"
                        ).permitAll()

                        /*
                         * Admin Endpoints
                         */
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        /*
                         * Management Endpoints
                         */
                        .requestMatchers("/api/manager/**")
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER"
                        )

                        /*
                         * Staff Endpoints
                         */
                        .requestMatchers("/api/staff/**")
                        .hasAnyRole(
                                "ADMIN",
                                "MANAGER",
                                "STAFF"
                        )

                        /*
                         * Everything else requires
                         * authentication.
                         */
                        .anyRequest()
                        .authenticated()
                )
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        /*
         * BCrypt is the industry standard
         * for password hashing.
         */
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(
                        customUserDetailsService
        );

        provider.setPasswordEncoder(
                passwordEncoder()
        );

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            DaoAuthenticationProvider authenticationProvider) {

        return new ProviderManager(
                authenticationProvider
        );
    }
}
