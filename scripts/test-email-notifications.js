#!/usr/bin/env node

const nodemailer = require('nodemailer')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

async function testEmailNotifications() {
  console.log(`${colors.blue}${colors.bold}Testing Email Notification System${colors.reset}\n`)
  
  try {
    // Create test transporter (using ethereal for testing)
    const testAccount = await nodemailer.createTestAccount()
    
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    
    console.log(`${colors.yellow}📧 Testing contact form notification email...${colors.reset}`)
    
    // Test contact form notification
    const contactFormEmail = {
      from: testAccount.user,
      to: 'admin@loftalgerie.com',
      subject: 'New Contact Form: Test Inquiry',
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Submission ID:</strong> test-submission-123</p>
        <p><strong>Name:</strong> John Doe</p>
        <p><strong>Email:</strong> john@example.com</p>
        <p><strong>Phone:</strong> +1234567890</p>
        <p><strong>Subject:</strong> Test Inquiry</p>
        <p><strong>Preferred Contact:</strong> email</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          This is a test message to verify the contact form email notifications are working correctly.
        </div>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> 192.168.1.1</p>
      `,
      replyTo: 'john@example.com'
    }
    
    const contactResult = await transporter.sendMail(contactFormEmail)
    console.log(`${colors.green}✅ Contact form notification sent successfully${colors.reset}`)
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(contactResult)}`)
    
    console.log(`\n${colors.yellow}📧 Testing property inquiry notification email...${colors.reset}`)
    
    // Test property inquiry notification
    const propertyInquiryEmail = {
      from: testAccount.user,
      to: 'admin@loftalgerie.com',
      subject: 'Property Inquiry: Rental Inquiry - Luxury Apartment Downtown',
      html: `
        <h2>New Property Inquiry</h2>
        <p><strong>Submission ID:</strong> test-inquiry-456</p>
        <p><strong>Property:</strong> Luxury Apartment Downtown</p>
        <p><strong>Inquiry Type:</strong> Rental Inquiry</p>
        <hr>
        <p><strong>Name:</strong> Jane Smith</p>
        <p><strong>Email:</strong> jane@example.com</p>
        <p><strong>Phone:</strong> +1987654321</p>
        <p><strong>Preferred Contact Time:</strong> Morning</p>
        <p><strong>Budget:</strong> $1500-2000/month</p>
        <p><strong>Move-in Date:</strong> 2024-06-01</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          I am interested in viewing this property next week. Please let me know available times.
        </div>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `,
      replyTo: 'jane@example.com'
    }
    
    const propertyResult = await transporter.sendMail(propertyInquiryEmail)
    console.log(`${colors.green}✅ Property inquiry notification sent successfully${colors.reset}`)
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(propertyResult)}`)
    
    console.log(`\n${colors.yellow}📧 Testing service inquiry notification email...${colors.reset}`)
    
    // Test service inquiry notification
    const serviceInquiryEmail = {
      from: testAccount.user,
      to: 'admin@loftalgerie.com',
      subject: 'Service Inquiry: Property Management - Bob Johnson',
      html: `
        <h2>New Service Inquiry</h2>
        <p><strong>Submission ID:</strong> test-service-789</p>
        <p><strong>Service Type:</strong> Property Management</p>
        <hr>
        <p><strong>Name:</strong> Bob Johnson</p>
        <p><strong>Email:</strong> bob@example.com</p>
        <p><strong>Phone:</strong> +1555987654</p>
        <p><strong>Property Type:</strong> Multiple Properties</p>
        <p><strong>Number of Properties:</strong> 3</p>
        <p><strong>Location:</strong> Downtown Area</p>
        <p><strong>Current Situation:</strong> Current Property Owner</p>
        <p><strong>Timeline:</strong> Within 1 Month</p>
        <p><strong>Budget:</strong> $800-1200/month per property</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          I own three rental properties and need professional management services. Looking for full-service management including tenant screening, rent collection, and maintenance coordination.
        </div>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `,
      replyTo: 'bob@example.com'
    }
    
    const serviceResult = await transporter.sendMail(serviceInquiryEmail)
    console.log(`${colors.green}✅ Service inquiry notification sent successfully${colors.reset}`)
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(serviceResult)}`)
    
    console.log(`\n${colors.yellow}📧 Testing callback request notification email...${colors.reset}`)
    
    // Test callback request notification
    const callbackEmail = {
      from: testAccount.user,
      to: 'admin@loftalgerie.com',
      subject: '🔔 CALLBACK REQUEST - Alice Brown - +1555123456',
      html: `
        <h2>New Callback Request</h2>
        <p><strong>Submission ID:</strong> test-callback-101</p>
        <p><strong>URGENT:</strong> Customer requesting callback</p>
        <hr>
        <p><strong>Name:</strong> Alice Brown</p>
        <p><strong>Phone:</strong> +1555123456</p>
        <p><strong>Preferred Time:</strong> Afternoon (12 PM - 6 PM)</p>
        <p><strong>Topic:</strong> General Inquiry</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p style="color: #d97706; font-weight: bold;">⚠️ This is a callback request - customer expects a phone call!</p>
      `,
      priority: 'high'
    }
    
    const callbackResult = await transporter.sendMail(callbackEmail)
    console.log(`${colors.green}✅ Callback request notification sent successfully${colors.reset}`)
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(callbackResult)}`)
    
    console.log(`\n${colors.yellow}📧 Testing user confirmation emails...${colors.reset}`)
    
    // Test user confirmation email
    const userConfirmationEmail = {
      from: testAccount.user,
      to: 'john@example.com',
      subject: 'Thank you for your message',
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Dear John Doe,</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <strong>Subject:</strong> Test Inquiry<br>
          <strong>Message:</strong><br>
          This is a test message to verify the contact form email notifications are working correctly.
        </div>
        <p>Best regards,<br>The Team</p>
      `
    }
    
    const confirmationResult = await transporter.sendMail(userConfirmationEmail)
    console.log(`${colors.green}✅ User confirmation email sent successfully${colors.reset}`)
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(confirmationResult)}`)
    
    console.log(`\n${colors.green}${colors.bold}🎉 All email notifications tested successfully!${colors.reset}`)
    console.log(`\n${colors.blue}Test Account Details:${colors.reset}`)
    console.log(`   User: ${testAccount.user}`)
    console.log(`   Pass: ${testAccount.pass}`)
    console.log(`   SMTP: smtp.ethereal.email:587`)
    
    return true
    
  } catch (error) {
    console.error(`${colors.red}❌ Email notification test failed:${colors.reset}`, error.message)
    return false
  }
}

// Run the test
testEmailNotifications()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error(`${colors.red}Error:${colors.reset}`, error)
    process.exit(1)
  })