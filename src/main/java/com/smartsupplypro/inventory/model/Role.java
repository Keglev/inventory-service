package com.smartsupplypro.inventory.model;

public enum Role {
    ADMIN, USER;

    public static Role fromString(String value) {
        return Role.valueOf(value.trim().replace(",", ""));
    }
}
