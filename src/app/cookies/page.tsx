
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CookiesPage() {
    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle>Cookies Policy for w3Develops</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">Effective Date: November 28, 2025</p>
                    
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">1. Introduction</h3>
                        <p>This Cookies Policy explains what cookies are and how w3Develops ("Company", "we", "us", or "our") uses them on our website, w3develops.org. By using our website, you consent to the use of cookies as described in this policy.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">2. What Are Cookies?</h3>
                        <p>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They allow the website to recognize your device and remember specific information about your session or preferences.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">3. How We Use Cookies</h3>
                        <p>We use cookies for a variety of reasons, ranging from keeping you logged in to tracking your behavior for marketing purposes. We classify our cookies into the following categories:</p>

                        <h4 className="font-semibold pt-2">A. Essential Cookies</h4>
                        <p>These cookies are necessary for the website to function properly. They enable core features such as:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li><strong>Security:</strong> detecting and preventing malicious activity.</li>
                            <li><strong>Authentication:</strong> keeping you logged into your account as you navigate between pages.</li>
                            <li><strong>Account Management:</strong> managing your study group sessions and competition entries.</li>
                        </ul>
                        <p>You cannot opt-out of these cookies as the website will not function without them.</p>

                        <h4 className="font-semibold pt-2">B. Performance and Analytics Cookies</h4>
                        <p>These cookies allow us to analyze how visitors use our website. We use this data to:</p>
                         <ul className="list-disc pl-6 text-muted-foreground">
                            <li>Track which pages are most popular.</li>
                            <li>See how users move through our site.</li>
                            <li>Identify errors or broken links.</li>
                            <li>Improve the overall user experience.</li>
                        </ul>

                        <h4 className="font-semibold pt-2">C. Functionality Cookies</h4>
                        <p>These cookies allow the website to remember choices you make, such as:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li>Your username.</li>
                            <li>Your language preference.</li>
                            <li>Customizations you have made to text size or fonts.</li>
                        </ul>

                         <h4 className="font-semibold pt-2">D. Targeting and Advertising Cookies</h4>
                        <p>We use these cookies to deliver content and advertisements that are relevant to your interests. We may use them to:</p>
                        <ul className="list-disc pl-6 text-muted-foreground">
                            <li>Show you ads for w3Develops on other websites (retargeting).</li>
                            <li>Limit the number of times you see an advertisement.</li>
                            <li>Measure the effectiveness of our marketing campaigns.</li>
                            <li>Build a profile of your interests to show you relevant content.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">4. Third-Party Cookies</h3>
                        <p>In addition to our own cookies, we may also use various third-parties cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on. Trusted partners like Google Analytics, Facebook (Meta), and other advertising networks may place cookies on your device.</p>
                        <p>We do not control the operation of these third-party cookies. You should check the privacy policies of those third parties for information on their practices.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">5. Managing Your Cookie Preferences</h3>
                        <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your web browser. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer.</p>
                        <p>Please note that if you choose to reject cookies, you may not be able to use the full functionality of our website (e.g., you may not be able to join a study group or log in).</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">6. Changes to This Cookies Policy</h3>
                        <p>We may update this Cookies Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please re-visit this Cookies Policy regularly to stay informed about our use of cookies and related technologies.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">7. Contact Us</h3>
                        <p>If you have any questions about our use of cookies or other technologies, please email us at:</p>
                        <a href="mailto:contact@w3develops.org" className="text-primary underline">contact@w3develops.org</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
