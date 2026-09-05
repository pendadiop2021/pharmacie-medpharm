package com.pharmacie.ventes.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaFallbackController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object statusObj = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object pathObj = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String path = pathObj != null ? pathObj.toString() : "";

        if (statusObj != null && "404".equals(statusObj.toString()) && !path.startsWith("/api")) {
            return "forward:/index.html";
        }
        return "error";
    }
}
