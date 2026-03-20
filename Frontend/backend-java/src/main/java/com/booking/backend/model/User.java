package com.booking.backend.model;

public class User {
    public String identity;
    public String name;
    public String email;
    public String mobile;

    public User(String identity, String name, String email, String mobile) {
        this.identity = identity;
        this.name = name;
        this.email = email;
        this.mobile = mobile;
    }

    public String getIdentity() { return identity; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getMobile() { return mobile; }
}
