package com.pharmacie.ventes.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SpaConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Redirige toute route Angular a un seul segment (ex: /ventes, /produits)
        // vers index.html, pour que l'application puisse gerer sa propre navigation.
        registry.addViewController("/{path:[^\\.]*}").setViewName("forward:/index.html");
    }
}
