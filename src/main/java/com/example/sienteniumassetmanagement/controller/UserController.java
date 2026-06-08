package com.example.sienteniumassetmanagement.controller;

import com.example.sienteniumassetmanagement.model.User;
import com.example.sienteniumassetmanagement.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;


@Controller
@RequestMapping("/users")
/*Thabo Hlompho Monei*/
public class UserController {

    @Autowired
    private UserService userService;


    @GetMapping
    public String listUsers(Model model) {
        List<User> users = userService.getAllUsers();
        model.addAttribute("users", users);
        model.addAttribute("pageTitle", "User Management");
        return "user-list"; // Expects: src/main/resources/templates/user-list.html
    }


    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("user", new User());
        model.addAttribute("roles", List.of("ADMIN", "MANAGER", "BORROWER"));
        model.addAttribute("pageTitle", "Add New User");
        model.addAttribute("formAction", "/users");
        model.addAttribute("isEdit", false);
        return "user-form"; // Expects: src/main/resources/templates/user-form.html
    }


    @PostMapping
    public String createUser(@ModelAttribute User user,
                             @RequestParam String plainPassword,
                             RedirectAttributes redirectAttributes) {
        try {
            User savedUser = userService.createUser(user, plainPassword);
            redirectAttributes.addFlashAttribute("success",
                    String.format("User '%s' created successfully!", savedUser.getName()));
            return "redirect:/users";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Failed to create user: " + e.getMessage());
            return "redirect:/users/new";
        }
    }


    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable Long id,
                               Model model,
                               RedirectAttributes redirectAttributes) {
        try {
            User user = userService.getUserById(id);
            model.addAttribute("user", user);
            model.addAttribute("roles", List.of("ADMIN", "MANAGER", "BORROWER"));
            model.addAttribute("pageTitle", "Edit User");
            model.addAttribute("formAction", "/users/edit/" + id);
            model.addAttribute("isEdit", true);
            return "user-form";
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", "User not found with ID: " + id);
            return "redirect:/users";
        }
    }

    @PostMapping("/edit/{id}")
    public String updateUser(@PathVariable Long id,
                             @ModelAttribute User user,
                             @RequestParam(required = false) String plainPassword,
                             RedirectAttributes redirectAttributes) {
        try {
            User updatedUser = userService.updateUser(id, user, plainPassword);
            redirectAttributes.addFlashAttribute("success",
                    String.format("User '%s' updated successfully!", updatedUser.getName()));
            return "redirect:/users";
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/users/edit/" + id;
        }
    }


    @PostMapping("/delete/{id}")
    public String deleteUser(@PathVariable Long id,
                             RedirectAttributes redirectAttributes) {
        try {
            User user = userService.getUserById(id); // Get name before deleting
            userService.deleteUser(id);
            redirectAttributes.addFlashAttribute("success",
                    String.format("User '%s' deleted successfully!", user.getName()));
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/users";
    }


    @GetMapping("/{id}")
    public String viewUser(@PathVariable Long id,
                           Model model,
                           RedirectAttributes redirectAttributes) {
        try {
            User user = userService.getUserById(id);
            model.addAttribute("user", user);
            model.addAttribute("pageTitle", "User Details");
            return "user-view";
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", "User not found");
            return "redirect:/users";
        }
    }
}