
/*
  ParkSmart ESP32 Hardware Integration
  Sample code for Entrance Gate and Spot Occupancy Sensors.
  
  Camera/OCR logic is assumed to be handled by a high-level system (like Raspberry Pi or PC) 
  which then calls this ESP32 or the API directly. This ESP32 acts as a controller for 
  servos (gates) and ultrasonic sensors (spot status).
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server API Configuration
const char* serverUrl = "http://your-app-url.com/api/hardware/status";
const char* entranceUrl = "http://your-app-url.com/api/hardware/entrance";

// Pin Configuration
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
const int GATE_SERVO_PIN = 13; // Placeholder for gate control

// Configuration for this specific spot
const String spotId = "A-1";
const int thresholdDistance = 15; // cm (below this = occupied)

bool currentStatus = false;

void setup() {
  Serial.begin(115200);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 1. Measure Distance
  long duration, distance;
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  duration = pulseIn(ECHO_PIN, HIGH);
  distance = (duration / 2) / 29.1;

  bool isOccupied = (distance < thresholdDistance && distance > 0);

  // 2. If status changed, update Server
  if (isOccupied != currentStatus) {
    updateStatus(isOccupied);
    currentStatus = isOccupied;
  }

  delay(5000); // Check every 5 seconds
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void updateStatus(bool occupied) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["spotId"] = spotId;
  doc["occupied"] = occupied;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    Serial.print("Status Updated: ");
    Serial.println(occupied ? "OCCUPIED" : "AVAILABLE");
  } else {
    Serial.print("Error updating status: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

// NOTE: For the ENTRANCE logic requested by the user:
// The Camera/OCR system should make a POST to /api/hardware/entrance
// with body: { "licensePlate": "CAR-123" }
// The response will contain the spotId to display on screen.
