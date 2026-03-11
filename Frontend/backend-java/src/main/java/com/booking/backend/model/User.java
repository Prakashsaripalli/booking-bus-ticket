package com.booking.backend.model;

public class User {
    private final String identity;
    private final String name;
    private final String email;
    private final String mobile;

    public User(String identity) {
        this(identity, "", "", "");
    }

    public User(String identity, String name, String email, String mobile) {
        this.identity = identity;
        this.name = name == null ? "" : name;
        this.email = email == null ? "" : email;
        this.mobile = mobile == null ? "" : mobile;
    }

    public String getIdentity() {
        return identity;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getMobile() {
        return mobile;
    }
}
