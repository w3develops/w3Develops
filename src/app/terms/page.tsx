
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle>Terms of Use for w3Develops</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">Effective Date: November 28, 2025</p>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">1. Acceptance of Terms</h3>
                        <p>Welcome to w3Develops ("Company", "we", "us", or "our"). By accessing or using our website located at w3develops.org (the "Site"), joining our study groups, participating in our competitions, or utilizing our educational resources (collectively, the "Services"), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of these Terms, you may not access the Service.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">2. Description of Service</h3>
                        <p>w3Develops provides free coding education resources, community study groups, programming competitions, and career development support. We reserve the right to modify, suspend, or discontinue any part of the Service at any time without notice or liability.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">3. User Accounts</h3>
                        <p>To access certain features (like study groups or competitions), you may be required to register for an account. You agree to:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li>Provide accurate, current, and complete information.</li>
                            <li>Maintain the security of your password and identification.</li>
                            <li>Accept all responsibility for any and all activities that occur under your account.</li>
                        </ul>
                        <p>We reserve the right to disable any user account at any time in our sole discretion for any or no reason, including if, in our opinion, you have failed to comply with any provision of these Terms.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">4. Community Code of Conduct</h3>
                        <p>Our community is built on collaboration and respect. By using our Services, you agree NOT to:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li>Harass, threaten, or intimidate other users.</li>
                            <li>Post content that is hateful, violent, discriminatory, or sexually explicit.</li>
                            <li>Disrupt study groups with spam, solicitations, or irrelevant content.</li>
                            <li>Cheat, manipulate, or exploit bugs during coding competitions.</li>
                            <li>Infringe upon the intellectual property rights of others.</li>
                        </ul>
                        <p>Violation of these rules will result in immediate termination of your account and ban from our community.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">5. User-Generated Content</h3>
                        <p>You retain ownership of the code, text, and projects you submit to the Service ("User Content"). However, by submitting User Content, you grant w3Develops a worldwide, non-exclusive, royalty-free, perpetual, and transferable license to use, reproduce, distribute, display, and perform your User Content in connection with the Service (e.g., showcasing competition winners, displaying portfolio projects).</p>
                        <p>You represent and warrant that you own or have the necessary rights to post your User Content and that it does not violate the rights of any third party.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">6. Intellectual Property Rights</h3>
                        <p>The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of w3Develops and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of w3Develops.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">7. Competitions and Prizes</h3>
                        <p>If you participate in our competitions:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li>You must abide by the specific rules posted for each contest.</li>
                            <li>We reserve the right to disqualify any participant for cheating or unsportsmanlike conduct.</li>
                            <li>Prizes are awarded at our sole discretion and are subject to availability. We are not responsible for lost or undelivered prizes.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">8. Third-Party Links</h3>
                        <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by w3Develops. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">9. Disclaimer of Warranties</h3>
                        <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. w3Develops makes no representations or warranties of any kind, express or implied, regarding the operation of the Service or the information, content, or materials included therein. You expressly agree that your use of the Service is at your sole risk.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">10. Limitation of Liability</h3>
                        <p>In no event shall w3Develops, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">11. Governing Law</h3>
                        <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which w3Develops is established, without regard to its conflict of law provisions.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">12. Changes to Terms</h3>
                        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">13. Contact Us</h3>
                        <p>If you have any questions about these Terms, please contact us at:</p>
                        <p>Email: <a href="mailto:contact@w3develops.org" className="text-primary underline">contact@w3develops.org</a></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
