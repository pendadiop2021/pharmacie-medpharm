package com.pharmacie.ventes.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DbMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DbMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        executerSansEchouer("ALTER TABLE produits ALTER COLUMN prix_cession DROP NOT NULL");
        executerSansEchouer("ALTER TABLE produits ALTER COLUMN prix_vente DROP NOT NULL");
        executerSansEchouer("ALTER TABLE produits DROP COLUMN IF EXISTS prix");
    }
    private void executerSansEchouer(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception e) {
            // Ignore
        }
    }
}
