
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle>Privacy Policy for w3Develops</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">Effective Date: November, 28 2025</p>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">1. Introduction</h3>
                        <p>Welcome to w3Develops("Company", "we", "our", "us"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website w3develops.org, join our study groups, or participate in our competitions.</p>
                        <p>By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy and our Terms of Service.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">2. Information We Collect</h3>
                        <p>We collect information that you provide to us directly, as well as information that is automatically collected when you use our services.</p>
                        
                        <h4 className="font-semibold pt-2">A. Personal Data</h4>
                        <p>While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. This includes, but is not limited to:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li>Email address</li>
                            <li>First name and last name</li>
                            <li>Phone number</li>
                            <li>Address, State, Province, ZIP/Postal code, City</li>
                            <li>Social media profiles and portfolio links</li>
                            <li>Work history and educational background (for job placement services)</li>
                        </ul>

                        <h4 className="font-semibold pt-2">B. Usage Data</h4>
                        <p>We may also collect information that your browser sends whenever you visit our Service or when you access the Service by or through a mobile device. This may include:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li>Internet Protocol (IP) address</li>
                            <li>Browser type and version</li>
                            <li>Time and date of your visit</li>
                            <li>Time spent on those pages</li>
                            <li>Unique device identifiers and other diagnostic data</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">3. How We Use Your Information</h3>
                        <p>We reserve the right to use the information we collect for any lawful business purpose, including but not limited to:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li><strong>Providing and maintaining our Service:</strong> To manage your registration, study groups, and competition entries.</li>
                            <li><strong>Communication:</strong> To contact you regarding your account, new features, solicitations, updates, and other news.</li>
                            <li><strong>Marketing and Advertising:</strong> To send you promotional materials, newsletters, and information about third-party products or services that may interest you.</li>
                            <li><strong>Data Analysis:</strong> To analyze user behavior and trends to improve our website and user experience.</li>
                            <li><strong>Partnerships:</strong> To share relevant data with hiring partners, recruiters, or educational affiliates to facilitate job placement opportunities.</li>
                            <li><strong>Business Transfers:</strong> To evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of our assets.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">4. Disclosure of Your Information</h3>
                        <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
                            <li><strong>Business Partners and Affiliates:</strong> We may share your information with our affiliates, business partners, or sponsors for marketing purposes or to offer you certain products, services, or promotions.</li>
                            <li><strong>Marketing Communications:</strong> With your consent (or where permitted by law), we may share your information with third parties for their own marketing purposes.</li>
                            <li><strong>Legal Requirements:</strong> We may disclose your information if we believe it is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">5. Tracking and Cookies</h3>
                        <p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">6. Your Data Rights</h3>
                        <p>Depending on your location, you may have certain rights regarding your personal data. We will comply with all applicable laws regarding data access, correction, and deletion requests to the extent required by the jurisdiction in which you reside.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">7. Security of Your Data</h3>
                        <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">8. Children's Privacy</h3>
                        <p>Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">9. Changes to This Privacy Policy</h3>
                        <p>We reserve the right to modify this Privacy Policy at any time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">10. Contact Us</h3>
                        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                        <p>By sending an email to <a href="mailto:contact@w3develops.org" className="text-primary underline">contact@w3develops.org</a></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
