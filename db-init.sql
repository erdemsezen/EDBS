CREATE TABLE servers (
    serverID int AUTO_INCREMENT,
    location varchar(20) NOT NULL UNIQUE,
    PRIMARY KEY (serverID)
);

CREATE TABLE users (
    username varchar(20),
    firstName varchar(35) NOT NULL,
    lastName varchar(35) NOT NULL,
    pass varchar(50) NOT NULL,
    privilege boolean NOT NULL,
    position varhcar(35),
    serverID int,
    imagePath varchar(500),
    PRIMARY KEY (username),
    FOREIGN KEY (serverID) REFERENCES servers(serverID)
);

CREATE TABLE requests (
    requestID int AUTO_INCREMENT,
    message varchar(100),
    requestDate date NOT NULL,
    status enum("Waiting Confirmation", "Not Confirmed", "Not Completed", "Pending", "Error", "Completed") NOT NULL,
    period enum("None", "Day", "Week", "Month", "Year") NOT NULL,
    serverID int,
    username varchar(20),
    PRIMARY KEY (requestID),
    FOREIGN KEY (serverID) REFERENCES servers(serverID),
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE backups (
    backupID int AUTO_INCREMENT,
    fileLocation varchar(500),
    backupDate datetime NOT NULL,
    username varchar(20),
    PRIMARY KEY (backupID),
    FOREIGN KEY (username) REFERENCES users(username)
);