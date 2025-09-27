package autoparts.kz.modules.user.dto;

public class UserProfileResponse {
        private Long id;
        private String clientName;
        private String country;
        private String state;
        private String city;
        private String officeAddress;
        private String type;
        private String surname;
        private String name;
        private String fathername;
        private String email;
        private String phone;
        private String lastBrowser;

        // Constructors
        public UserProfileResponse() {}

        public UserProfileResponse(Long id, String clientName, String country, String state, String city, 
                                 String officeAddress, String type, String surname, String name, 
                                 String fathername, String email, String phone, String lastBrowser) {
            this.id = id;
            this.clientName = clientName;
            this.country = country;
            this.state = state;
            this.city = city;
            this.officeAddress = officeAddress;
            this.type = type;
            this.surname = surname;
            this.name = name;
            this.fathername = fathername;
            this.email = email;
            this.phone = phone;
            this.lastBrowser = lastBrowser;
        }

        // Getters and Setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getClientName() {
            return clientName;
        }

        public void setClientName(String clientName) {
            this.clientName = clientName;
        }

        public String getCountry() {
            return country;
        }

        public void setCountry(String country) {
            this.country = country;
        }

        public String getState() {
            return state;
        }

        public void setState(String state) {
            this.state = state;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getOfficeAddress() {
            return officeAddress;
        }

        public void setOfficeAddress(String officeAddress) {
            this.officeAddress = officeAddress;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getSurname() {
            return surname;
        }

        public void setSurname(String surname) {
            this.surname = surname;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getFathername() {
            return fathername;
        }

        public void setFathername(String fathername) {
            this.fathername = fathername;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getLastBrowser() {
            return lastBrowser;
        }

        public void setLastBrowser(String lastBrowser) {
            this.lastBrowser = lastBrowser;
        }
}
