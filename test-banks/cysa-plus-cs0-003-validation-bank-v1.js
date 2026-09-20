const rows = [
["1","1.1 Time synchronization","A SOC is correlating authentication and firewall events from several systems, but timestamps differ by several minutes. Which control should be corrected first to improve event correlation?","Increase log retention","Synchronize system clocks with a trusted time source","Disable verbose logging","Move logs to cold storage","B"],
["1","1.1 Privileged access management","An organization wants administrators to use elevated privileges only when needed and to record privileged sessions. Which control best addresses this requirement?","Single sign-on","Privileged access management","Federation","Passwordless authentication","B"],
["1","1.2 Malicious network activity","A workstation makes small encrypted outbound connections to the same unfamiliar host every five minutes. Which activity is most likely?","Command-and-control beaconing","Routine patch management","ARP cache refresh","Database replication","A"],
["1","1.2 Malicious host activity","An analyst observes a newly created scheduled task launching PowerShell from a user-writable directory at logon. What is the most likely security concern?","Persistence","Load balancing","Data classification","Certificate renewal","A"],
["1","1.3 Packet capture","An analyst needs to inspect packet contents and TCP conversations from a suspicious host. Which tool is most appropriate?","Wireshark","Prowler","GDB","Recon-ng","A"],
["1","1.3 SIEM correlation","A SOC wants to correlate authentication failures, endpoint alerts, and firewall events from many systems in one place. Which technology best fits?","SIEM","CASB","PKI","NAT","A"],
["1","1.3 File analysis","An analyst receives a suspicious executable and wants to compare its cryptographic hash against known-malware intelligence before execution. Which action is most appropriate?","Calculate the file hash and query a reputation source","Run the file with administrator privileges","Disable endpoint protection and observe behavior","Rename the executable and email it to another analyst","A"],
["1","1.4 Threat intelligence confidence","Two threat feeds disagree about whether an IP address is malicious. What should the analyst consider first before blocking the address enterprise-wide?","Source reliability, confidence, and corroborating evidence","Alphabetical order of the feeds","Which feed has more indicators overall","Whether the IP address is easy to remember","A"],
["1","1.4 Threat hunting","A threat hunter starts with a hypothesis that attackers are abusing remote management tools and searches telemetry for supporting evidence. Which activity is this?","Hypothesis-driven threat hunting","Vulnerability scanning","Configuration auditing","Digital signing","A"],
["1","1.4 Intelligence enrichment","A SOAR workflow automatically adds WHOIS ownership, IP reputation, and geolocation data to new alerts. What capability is being demonstrated?","Threat-intelligence enrichment","Database normalization","File carving","Memory acquisition","A"],
["2","2.1 Internal vs external scanning","A security team wants to identify vulnerabilities visible to an attacker on the public Internet. Which scan perspective is most appropriate?","External scanning","Internal scanning","Authenticated local scanning only","Offline configuration review only","A"],
["2","2.1 Agent-based scanning","A company must assess laptops that are frequently off the corporate network. Which scanning approach provides the most consistent coverage?","Agent-based scanning","Unauthenticated perimeter scanning","Passive DNS monitoring","Manual packet capture","A"],
["2","2.1 Scan scheduling","A vulnerability scan repeatedly causes performance degradation on a fragile production database. What is the best first adjustment?","Schedule scanning during an approved maintenance window","Increase scan concurrency","Disable authentication for the scan","Ignore the database permanently","A"],
["2","2.2 CVSS context","Two vulnerabilities have the same CVSS base score. One affects an isolated test system, while the other affects an Internet-facing payment server with a known exploit. Which should be prioritized first?","The Internet-facing payment server","The isolated test system","Whichever vulnerability was discovered first","Both must always have identical priority","A"],
["2","2.2 False positive validation","A scanner reports a critical vulnerability on a server, but manual verification shows the vulnerable component is not installed. How should the finding be classified?","False positive","True positive","False negative","Accepted risk","A"],
["2","2.2 Asset value","A medium-severity vulnerability affects a domain controller, while a high-severity vulnerability affects a disposable lab VM with no sensitive data. What factor most strongly supports prioritizing the domain controller?","Asset criticality","Scanner brand","Length of the vulnerability description","Number of open browser tabs","A"],
["2","2.4 SQL injection mitigation","A web application builds SQL queries by concatenating user input. Which control most directly reduces SQL injection risk?","Parameterized queries","Output compression","Longer session timeouts","Client-side logging","A"],
["2","2.4 Cross-site scripting mitigation","A web application reflects user-controlled input into HTML responses. Which control most directly reduces cross-site scripting risk?","Context-appropriate output encoding","Database encryption","Network segmentation","Certificate pinning","A"],
["2","2.4 Attack surface reduction","An organization discovers an unused Internet-facing administration interface. What is the best mitigation?","Disable or remove the exposed service","Increase the banner detail","Add the host to an asset spreadsheet only","Schedule a quarterly review without changing exposure","A"],
["3","3.1 Diamond Model","An analyst using the Diamond Model is documenting the infrastructure used by an adversary to host command-and-control servers. Which Diamond Model feature is being described?","Infrastructure","Victim","Capability","Adversary","A"],
["3","3.1 MITRE ATT&CK","A SOC maps observed attacker behavior to techniques such as credential dumping and scheduled task creation. Which framework is best suited for this mapping?","MITRE ATT&CK","CVSS","COBIT","PCI DSS","A"],
["3","3.2 Chain of custody","An analyst collects a disk image that may be used in legal proceedings. Which action best supports chain of custody?","Document each transfer and handler of the evidence","Compress the image to save space without recording the change","Allow unrestricted analyst access","Rename the image after every review","A"],
["3","3.2 Containment","A compromised workstation is actively communicating with a known command-and-control server. What is the most appropriate immediate containment action?","Isolate the workstation from the network","Delete all logs","Reimage every workstation in the organization","Notify the media","A"],
["3","3.3 Tabletop exercise","A security team walks through a ransomware scenario without affecting production systems to evaluate roles and decision making. What preparation activity is this?","Tabletop exercise","Penetration test","Forensic acquisition","Risk transfer","A"],
["3","3.3 Lessons learned","After an incident is closed, the team reviews what worked, what failed, and which procedures should change. Which phase is this?","Post-incident lessons learned","Initial detection","Containment","Evidence preservation","A"],
["4","4.1 Vulnerability reporting","A vulnerability report for executives needs to support remediation decisions. Which content is most useful?","Affected assets, business risk, priority, and recommended mitigation","Raw scanner output only","Every packet captured during scanning","A list of analyst usernames","A"],
["4","4.1 Remediation inhibitor","A critical legacy system cannot be patched because the vendor no longer supports the application and replacement will take six months. What should the report emphasize?","Compensating controls and the remediation constraint","That the vulnerability should be deleted from tracking","That the scan must have been incorrect","That business impact is irrelevant","A"],
["4","4.1 Metrics","Leadership wants a measure of how long critical vulnerabilities remain unresolved after discovery. Which metric is most relevant?","Mean time to remediate","Mean time to detect","Alert volume","Packet loss","A"],
["4","4.2 Incident communication","During a major incident involving regulated customer data, which stakeholder should be engaged to determine notification obligations?","Legal and compliance","Facilities maintenance","Software procurement only","Graphic design","A"],
["4","4.2 Executive reporting","Which element is most appropriate in an executive incident summary?","Business impact, scope, timeline, and recommended actions","Full memory dumps","Every raw SIEM event","All analyst command histories","A"]
];

window.CYSA_QUESTION_BANK = {
  schemaVersion: 1,
  bankId: "cysa-plus-cs0-003-validation-v1",
  bankVersion: "1.0.0",
  title: "CompTIA CySA+ CS0-003 Validation Bank v1",
  questions: rows.map((r, i) => ({
    id: `C${String(i + 1).padStart(3, "0")}`,
    number: i + 1,
    domain: r[0],
    target: r[1],
    stem: r[2],
    options: { A: r[3], B: r[4], C: r[5], D: r[6] },
    answer: r[7]
  }))
};
