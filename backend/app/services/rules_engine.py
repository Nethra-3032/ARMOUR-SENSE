import math
from typing import List, Dict, Any, Tuple
from app.config import settings

def evaluate_mechanical_rules(
    product_type: str,
    air_temp: float,
    process_temp: float,
    speed: float,
    torque: float,
    tool_wear: float,
    model_prob: float
) -> Tuple[List[Dict[str, Any]], List[str], str]:
    """
    Evaluates physical engineering limits and deterministic rules for equipment health.
    Returns:
        - rule_alerts: structured list of rule detections
        - warnings: string warnings for telemetry anomalies
        - recommended_action: high-level maintenance directive
    """
    rule_alerts = []
    warnings = []
    
    # 1. Delta Temperature (Heat Dissipation Rule)
    temp_diff = process_temp - air_temp
    if temp_diff < 8.0:
        rule_alerts.append({
            "rule_name": "Inadequate Process Temperature Rise",
            "severity": "Warning",
            "trigger_condition": f"Process - Air Temp Delta = {temp_diff:.1f} K (< 8.0 K)",
            "explanation": "Insufficient thermal dissipation or potential temperature sensor drift observed."
        })
    elif temp_diff > 12.0:
        rule_alerts.append({
            "rule_name": "Excessive Thermal Gradient",
            "severity": "Critical" if temp_diff > 13.5 else "Warning",
            "trigger_condition": f"Process - Air Temp Delta = {temp_diff:.1f} K (> 12.0 K)",
            "explanation": "High thermal dissipation indicates elevated friction, coolant deficiency, or heavy continuous operating strain."
        })

    # 2. Tool Wear Degradation Rule
    if tool_wear >= 200.0:
        rule_alerts.append({
            "rule_name": "Severe Tool Wear Limit",
            "severity": "Critical",
            "trigger_condition": f"Tool Wear = {tool_wear:.0f} min (Threshold >= 200 min)",
            "explanation": "Tool wear has reached end-of-life replacement threshold. High probability of surface finish degradation or tool breakage."
        })
    elif tool_wear >= 160.0:
        rule_alerts.append({
            "rule_name": "Elevated Tool Wear",
            "severity": "Warning",
            "trigger_condition": f"Tool Wear = {tool_wear:.0f} min (Threshold >= 160 min)",
            "explanation": "Tool wear approaching operational replacement threshold. Schedule inspection at next servicing window."
        })

    # 3. Mechanical Power Rule: Power = Torque * Angular Velocity
    # Angular velocity omega = (speed_rpm * 2 * pi) / 60
    # Power = Torque * omega (Watts)
    power_watts = torque * (speed * 2.0 * math.pi / 60.0)
    
    # High power / overload
    if power_watts > 9000.0:
        rule_alerts.append({
            "rule_name": "Drive System Over-Power Spike",
            "severity": "Critical",
            "trigger_condition": f"Calculated Power = {power_watts:.0f} W (> 9000 W)",
            "explanation": "Combination of rotational speed and torque exceeds rated drive transmission design limits. Motor overload risk."
        })
    elif power_watts < 2200.0 and speed > 1000:
        rule_alerts.append({
            "rule_name": "Under-Torque Anomaly / Low Transmission Power",
            "severity": "Warning",
            "trigger_condition": f"Calculated Power = {power_watts:.0f} W (< 2200 W at {speed:.0f} rpm)",
            "explanation": "Abnormally low torque at operational speeds suggests potential decoupling, slip, or faulty torque transducer."
        })

    # 4. Overstrain Rule (Product of Torque and Tool Wear)
    strain_indicator = torque * tool_wear
    if strain_indicator > 11000.0:
        rule_alerts.append({
            "rule_name": "Mechanical Overstrain Condition",
            "severity": "Critical",
            "trigger_condition": f"Torque x Tool Wear Index = {strain_indicator:.0f} (> 11000)",
            "explanation": "Simultaneous high torque applied to worn tooling significantly accelerates mechanical failure and cutter shatter."
        })
    elif torque > 65.0:
        rule_alerts.append({
            "rule_name": "Extreme Torque Load",
            "severity": "Warning",
            "trigger_condition": f"Torque = {torque:.1f} Nm (> 65.0 Nm)",
            "explanation": "High mechanical resistance observed on spindle assembly. Check for mechanical binding or workpiece resistance."
        })

    # 5. Out-of-distribution Warnings
    bounds = settings.BOUNDS
    if air_temp < bounds["air_temperature"]["min"] or air_temp > bounds["air_temperature"]["max"]:
        warnings.append(f"Air temperature ({air_temp} K) is outside historical training distribution [290-315 K].")
    if process_temp < bounds["process_temperature"]["min"] or process_temp > bounds["process_temperature"]["max"]:
        warnings.append(f"Process temperature ({process_temp} K) is outside historical training distribution [298-325 K].")
    if speed < bounds["rotational_speed"]["min"] or speed > bounds["rotational_speed"]["max"]:
        warnings.append(f"Rotational speed ({speed} rpm) is outside historical operating envelope [400-3000 rpm].")
    if torque < bounds["torque"]["min"] or torque > bounds["torque"]["max"]:
        warnings.append(f"Torque ({torque} Nm) is outside typical range [3-90 Nm].")
    if tool_wear > bounds["tool_wear"]["max"]:
        warnings.append(f"Tool wear ({tool_wear} min) exceeds maximum logged wear record (260 min).")

    # Generate synthesized human recommendation
    has_critical = any(a["severity"] == "Critical" for a in rule_alerts) or model_prob >= 0.70
    has_warning = any(a["severity"] == "Warning" for a in rule_alerts) or model_prob >= 0.35

    if has_critical:
        action_parts = []
        if tool_wear >= 200.0 or strain_indicator > 11000.0:
            action_parts.append("Halt spindle operation and replace worn tool assembly.")
        if power_watts > 9000.0:
            action_parts.append("Inspect drive motor, gearhead, and electrical supply for overload stress.")
        if temp_diff > 12.0:
            action_parts.append("Inspect thermal management system and cooling circulation channels.")
        if not action_parts:
            action_parts.append("Immediate physical inspection and human review recommended due to high AI risk score.")
        recommended_action = "CRITICAL ACTION REQUIRED: " + " ".join(action_parts)
    elif has_warning:
        action_parts = []
        if tool_wear >= 160.0:
            action_parts.append("Plan tool replacement during next scheduled service.")
        if temp_diff < 8.0 or temp_diff > 12.0:
            action_parts.append("Calibrate temperature sensors and check heat exchange fins.")
        if torque > 55.0:
            action_parts.append("Verify spindle lubrication and drive belt tension.")
        if not action_parts:
            action_parts.append("Increase telemetry sampling frequency and monitor for progressive degradation.")
        recommended_action = "PREVENTIVE MAINTENANCE ADVISORY: " + " ".join(action_parts)
    else:
        recommended_action = "NOMINAL OPERATIONAL STATUS: All mechanical telemetry within safety envelopes. Maintain standard maintenance intervals."

    return rule_alerts, warnings, recommended_action
