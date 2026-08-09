import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Bond, your Data Provenance Assistant. I can help you understand file analysis results, explain cybersecurity concepts, and guide you through data lineage features. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowercaseMessage = userMessage.toLowerCase();

    // File analysis related
    if (lowercaseMessage.includes('file') || lowercaseMessage.includes('upload') || lowercaseMessage.includes('analyze')) {
      return 'To analyze a file, navigate to the Dashboard and click the "Analyze File" button. Supported formats include .json, .csv, .txt, .xml, .pdf, .log, .yaml, .ini, .py, .js, .java, .php, .sh, .yml, and Dockerfiles. After upload, you\'ll see:\n\n• Comprehensive risk scoring (0-100)\n• CVE vulnerability mappings\n• Data lineage visualization\n• Security issues and recommendations\n• Downloadable PDF/JSON reports\n\nThe system automatically detects hardcoded secrets, SQL injection patterns, XSS vulnerabilities, and insecure configurations.';
    }

    // CVE related
    if (lowercaseMessage.includes('cve') || lowercaseMessage.includes('vulnerability')) {
      return 'CVE (Common Vulnerabilities and Exposures) are publicly disclosed cybersecurity flaws. Our system:\n\n• Maps detected issues to official CVE identifiers\n• Provides CVSS scores and severity ratings (Low/Medium/High/Critical)\n• Shows affected components and versions\n• Recommends specific remediation steps\n• Links to official CVE databases (NVD, MITRE)\n\nExample CVEs detected:\n- CVE-2024-1234: SQL Injection in database layer\n- CVE-2024-5678: Hardcoded credentials exposure\n- CVE-2024-9012: Command injection vulnerability\n\nCheck the File Analysis page for detailed CVE information.';
    }

    // Risk score related
    if (lowercaseMessage.includes('risk') || lowercaseMessage.includes('score')) {
      return 'Risk scores are calculated using a comprehensive multi-factor analysis:\n\n🔴 CRITICAL (70-100): Immediate action required\n- Hardcoded secrets/credentials\n- SQL/Command injection vulnerabilities\n- Critical CVEs (CVSS 9.0+)\n\n🟡 MEDIUM (40-69): Should be addressed soon\n- Weak encryption methods\n- Missing input validation\n- Moderate CVEs (CVSS 4.0-8.9)\n\n🟢 LOW (0-39): Minor issues or best practices\n- Code quality improvements\n- Documentation gaps\n- Low CVEs (CVSS 0.1-3.9)\n\nFactors considered:\n• Structural Risk: Data quality, format issues\n• Security Risk: Vulnerabilities, threats\n• Integrity Risk: Data consistency, validation\n• Compliance Risk: Regulatory requirements';
    }

    // Data lineage related
    if (lowercaseMessage.includes('lineage') || lowercaseMessage.includes('provenance') || lowercaseMessage.includes('tracking')) {
      return 'Data lineage tracks the complete lifecycle of your data:\n\n📊 Source → Transformation → Storage → Output\n\nKey features:\n• Visual flow diagrams showing data movement\n• Transformation history with timestamps\n• User activity tracking (who, what, when)\n• Version control for all datasets\n• Compliance audit trails\n• Impact analysis for changes\n\nUse cases:\n✓ Debugging data quality issues\n✓ Regulatory compliance (GDPR, HIPAA)\n✓ Root cause analysis\n✓ Change impact assessment\n✓ Data governance\n\nView lineage in the Lineage section or in individual file analysis reports.';
    }

    // Security related
    if (lowercaseMessage.includes('security') || lowercaseMessage.includes('threat') || lowercaseMessage.includes('hardcoded')) {
      return 'Our advanced security analysis detects multiple threat categories:\n\n🔐 CREDENTIAL EXPOSURE:\n• Hardcoded API keys (Stripe, AWS, etc.)\n• Database passwords in code\n• JWT secrets and encryption keys\n• OAuth tokens and credentials\n\n💉 INJECTION ATTACKS:\n• SQL injection vulnerabilities\n• Command injection risks\n• LDAP injection patterns\n• XML External Entity (XXE)\n\n🌐 WEB VULNERABILITIES:\n• Cross-Site Scripting (XSS)\n• Cross-Site Request Forgery (CSRF)\n• Insecure redirects\n• Path traversal attacks\n\n⚙️ CONFIGURATION ISSUES:\n• Weak cryptographic algorithms\n• Insecure deserialization\n• Improper access controls\n• Missing security headers\n\nEach issue includes:\n- Severity level and CVSS score\n- Affected code location\n- Exploitation scenario\n- Detailed remediation steps\n- Reference links to security advisories';
    }

    // Version control related
    if (lowercaseMessage.includes('version') || lowercaseMessage.includes('history')) {
      return 'Version control provides complete change tracking:\n\n📝 For each version, you can view:\n• Modification timestamp\n• User who made changes\n• Detailed change summary\n• Before/after comparisons\n• Rollback capabilities\n\nFeatures:\n✓ Automatic versioning on every update\n✓ Change notifications\n✓ Audit trail compliance\n✓ Branch and merge tracking\n✓ Conflict resolution\n\nAccess version history through:\n- Datasets section (version dropdown)\n- File analysis reports (version tab)\n- Audit logs (detailed change history)';
    }

    // Export/report related
    if (lowercaseMessage.includes('export') || lowercaseMessage.includes('download') || lowercaseMessage.includes('report')) {
      return 'Export comprehensive analysis reports in multiple formats:\n\n📄 PDF REPORTS:\n• Executive summary with key findings\n• Detailed vulnerability breakdown\n• Visual charts and graphs\n• CVE mappings and CVSS scores\n• Remediation recommendations\n• Compliance checklist\n• Perfect for audits, presentations, and documentation\n\n📊 JSON EXPORTS:\n• Raw structured data\n• All analysis metadata\n• API integration ready\n• Automated processing\n• Custom tool integration\n\nHow to export:\n1. Navigate to File Analysis page\n2. Click "Export Report" button\n3. Choose PDF or JSON format\n4. Report downloads instantly\n\nReports include timestamp, analyst info, and are audit-ready for compliance requirements (SOC2, ISO 27001, HIPAA, GDPR).';
    }

    // Admin features
    if (lowercaseMessage.includes('admin') || lowercaseMessage.includes('block') || lowercaseMessage.includes('control')) {
      return 'Admin controls (admin access only):\n\n👥 USER MANAGEMENT:\n• View all users and their activity\n• Block/unblock user access\n• Monitor session times and uptime\n• Track actions per user\n\n🤖 CHATBOT CONTROLS:\n• Enable/disable chatbot per user\n• Set security modes (Normal/Restricted/Disabled)\n• View chatbot interaction logs\n• Detect suspicious query patterns\n\n📊 SYSTEM MONITORING:\n• Real-time activity dashboards\n• Threat detection analytics\n• User behavior trends\n• System health metrics\n\n🔔 ALERTS & NOTIFICATIONS:\n• Critical threat alerts\n• Unusual activity detection\n• System event monitoring\n• Compliance warnings\n\nAdmin panel accessible at: Dashboard → Admin Panel';
    }

    // Login/authentication
    if (lowercaseMessage.includes('login') || lowercaseMessage.includes('password') || lowercaseMessage.includes('credentials')) {
      return 'Login credentials:\n\n👤 REGULAR USERS:\nEmail: Any user email (e.g., chirag.singh@company.com)\nPassword: password\n\n🔐 ADMIN ACCESS:\nEmail: admin@dataprovenance.com\nPassword: [Contact system administrator]\n\nSecurity features:\n• Session tracking with automatic timeout\n• Login/logout audit logging\n• Password validation\n• Secure authentication tokens\n\nNote: For security, admin credentials are not displayed in help. Contact your system administrator for admin access.';
    }

    // Features overview
    if (lowercaseMessage.includes('feature') || lowercaseMessage.includes('what can') || lowercaseMessage.includes('capabilities')) {
      return 'Data Provenance System - Key Features:\n\n🔍 FILE ANALYSIS:\n• Multi-format support (JSON, CSV, Python, JavaScript, etc.)\n• Real-time vulnerability scanning\n• CVE mapping and CVSS scoring\n• Risk assessment and recommendations\n\n📊 DATA MANAGEMENT:\n• Dataset version control\n• Data lineage visualization\n• Transformation tracking\n• Audit trail compliance\n\n🔒 SECURITY:\n• Hardcoded secret detection\n• Injection vulnerability scanning\n• Configuration security analysis\n• Compliance checking (GDPR, HIPAA, SOC2)\n\n👥 COLLABORATION:\n• Multi-user support\n• Role-based access control\n• Activity tracking\n• AI chatbot assistance\n\n📈 REPORTING:\n• Professional PDF reports\n• JSON data exports\n• Visual dashboards\n• Real-time analytics\n\nPerfect for: Security teams, compliance officers, data engineers, DevOps, and IT administrators.';
    }

    // General help
    if (lowercaseMessage.includes('help') || lowercaseMessage.includes('how') || lowercaseMessage.includes('what')) {
      return "I'm Bond, your Data Provenance AI Assistant! Here's what I can help you with:\n\n📂 FILE ANALYSIS: Upload and analyze files for vulnerabilities\n🔒 SECURITY & CVE: Understand threats and vulnerabilities\n📊 RISK SCORES: Interpret risk levels and severity\n🔗 DATA LINEAGE: Track data flow and transformations\n📝 VERSION CONTROL: Manage dataset versions\n📥 REPORTS: Export analysis in PDF/JSON\n⚙️ SYSTEM FEATURES: Learn about capabilities\n🔐 ADMIN: User management and controls (admin only)\n\nJust ask me anything! Examples:\n• \"How do I analyze a file?\"\n• \"What does a risk score of 85 mean?\"\n• \"Explain CVE mapping\"\n• \"How to export a report?\"\n• \"What is data lineage?\"\n\nI'm here 24/7 to assist you!";
    }

    // Default response with suggestions
    return "I'm Bond, here to help with data provenance, file analysis, and cybersecurity! I didn't quite understand that question.\n\nTry asking about:\n• 📂 File upload and analysis\n• 🔒 CVE vulnerabilities\n• 📊 Risk scores\n• 🔗 Data lineage\n• 📝 Version control\n• 📥 Report exports\n• ⚙️ System features\n• 👥 Admin controls\n\nOr just type \"help\" to see all available topics!";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2 border-red-200 dark:border-red-900">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-white" />
                  <h3 className="font-semibold text-white">Bond — AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="h-96 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-red-100' : 'text-slate-500 dark:text-gray-400'}`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t dark:border-gray-700">
                <div className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Bond anything..."
                    className="flex-1"
                  />
                  <Button onClick={handleSend} size="icon" className="bg-red-600 hover:bg-red-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}