import requests
import threading
import random
import json
from datetime import datetime, timedelta

# Function to generate random datetime strings within a range of months and days
def random_date(start, end):
    random_days = random.randint(0, (end - start).days)
    return (start + timedelta(days=random_days)).strftime('%Y-%m-%d')

# Start and end datetime for generating random times
start_time = datetime(2019, 1, 1)
end_time = datetime(2024, 12, 31)

# List of functions to be used
functions = [
    "onGenerateFibulaPlanesTimerTimeout",
    "makeBooleanOperationsToFibulaSurgicalGuideBase",
    "sendFunctionCountToServer",
    "initializeSystemDiagnostics",
    "updateFirmwareVersions",
    "calculateOptimalPathways",
    "archiveOldLogFiles",
    "monitorNetworkLatency",
    "generateEncryptionKeys",
    "validateUserPermissions",
    "optimizeDatabaseQueries",
    "deploySoftwareUpdates",
    "auditSecurityCompliance",
    "scheduleSystemBackups",
    "analyzeServerPerformance",
    "configureVirtualMachines",
    "restoreArchivedData",
    "trackApplicationDependencies",
    "manageResourceAllocation",
    "simulateLoadBalancing",
    "verifyDataIntegrity",
    "cleanTemporaryFiles",
    "reportSystemHealthStatus"
]

# List of medical module names
modules = [
    "CardiovascularAssessmentTool",
    "NeuralNetworkDiagnostics",
    "OrthopedicProcedureSimulator",
    "PediatricCareAssistant",
    "OphthalmologyVisionAnalyzer",
    "GastrointestinalTracker",
    "EndocrineHealthMonitor",
    "PulmonaryFunctionTester",
    "DermatologyTreatmentPlanner",
    "NeurosurgeryNavigationSystem",
    "HematologyAnalyzer",
    "InfectiousDiseaseMapper",
    "RadiologyImagingCenter",
    "UrologyManagementSystem",
    "ObstetricsLaborTracker",
    "GeneticDisorderExplorer",
    "ImmunologyResponseEvaluator",
    "OncologyTreatmentOptimizer",
    "EmergencyResponseCoordinator",
    "MentalHealthTherapyAssistant",
    "RehabilitationExercisePlanner",
    "PainManagementAdvisor",
    "SleepDisorderAnalyzer",
    "AllergyReactionTracker",
    "DentalHealthProfiler",
    "NutritionAndDietPlanner",
    "FitnessAndWellnessGuide",
    "BloodPressureRegulator",
    "DiabetesCareManager",
    "WoundCareToolkit",
    "SubstanceAbuseCounselor",
    "GeriatricCarePlanner",
    "ENTProcedureGuide",
    "FertilityAndIVFHelper",
    "SportsInjuryPreventor",
    "PharmacyInventoryManager",
    "PatientEngagementHub",
    "SurgicalInstrumentTracker",
    "HealthcareComplianceMonitor",
    "MedicalResearchDatabase",
    "TelemedicineConsultationPortal",
    "VaccineAdministrationLog",
    "AmbulanceDispatchSystem",
    "MedicalWasteManagement",
    "HospitalRoomAllocationSystem",
    "PatientFeedbackAnalyzer",
    "MedicalBillingAndCoding",
    "HealthcarePolicyLibrary",
    "ClinicalTrialManager",
    "MedicalEducationSimulator"
]

# Function to generate a random data entry
def generate_random_data_entry():
    return {
        "component": random.choice(modules),
        "event": random.choice(functions),
        "day": random_date(start_time, end_time),
        "times": str(random.randint(1, 10))  # Random number of times between 1 and 10
    }

# Function to send a request to the Flask app
def send_request(ip):
    data = generate_random_data_entry()
    headers = {'X-Forwarded-For': ip}
    response = requests.post('http://127.0.0.1:8080/telemetry', headers=headers, json=data)
    print(f"IP: {ip}, Status Code: {response.status_code}, Response: {response.text}")

# Generate random IP addresses
def generate_random_ips(length):
    ip_list = []
    for _ in range(length):
        ip = ".".join(str(random.randint(0, 255)) for _ in range(4))
        ip_list.append(ip)
    return ip_list

# Generate a list of random IP addresses
ip_list = generate_random_ips(20)

# Create and start threads to simulate concurrent requests
threads = []
for ip in ip_list:
    thread = threading.Thread(target=send_request, args=(ip,))
    threads.append(thread)
    thread.start()

# Wait for all threads to complete
for thread in threads:
    thread.join()