const profile = new StorageNode("profile");

// General user preferences
profile.add_value("target", 83);

profile.add_value("mls_per_cap", 15);
profile.add_value("glucose_density", 15/60);
profile.add_value("eglucose", 4.75);

// E values : effectiveness (mg/dL) / (unit/gram)
profile.add_value("ecarbs", 4.75);
profile.add_value("eprotein", 1.23);
profile.add_value("einsulin", 28.7);

// P values : peak time (hours)
profile.add_value("pcarbs", 1.00);
profile.add_value("pprotein", 2.15);
profile.add_value("pinsulin", 1.81);

// N values : delay (hours)
profile.add_value("ncarbs", 0.0);
profile.add_value("nprotein", 0.8);
profile.add_value("ninsulin", 0.5);