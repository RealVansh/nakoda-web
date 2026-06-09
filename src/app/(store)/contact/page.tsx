import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Nakoda Jewellers',
  description: 'Contact Nakoda Jewellers for custom jewellery, product inquiries, showroom visits, and support.',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold tracking-widest text-foreground uppercase mb-8">Contact Us</h1>
        <div className="h-1 w-24 bg-primary mx-auto mb-12"></div>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Have a question about a custom design, or want to inquire about a specific piece? We are here to help. Reach out to us via email or visit our showroom.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div className="bg-secondary p-8 rounded-lg border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wider">Visit Us</h3>
          <p className="text-muted-foreground">11, Periya Naicken Street, Galada Plaza, 1st Floor, Sowcarpet, Chennai - 600 079</p>
        </div>
        <div className="bg-secondary p-8 rounded-lg border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wider">Call Us</h3>
          <p className="text-muted-foreground">
            <a href="tel:+919840403795" className="hover:text-primary transition-colors">+91 9840403795</a><br/>
            Mon-Sat, 10am - 8pm
          </p>
        </div>
        <div className="bg-secondary p-8 rounded-lg border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 uppercase tracking-wider">Email Us</h3>
          <p className="text-muted-foreground">
            <a href="mailto:nakoda566@gmail.com" className="hover:text-primary transition-colors">nakoda566@gmail.com</a><br/>
            <a href="mailto:support@nakoda.com" className="hover:text-primary transition-colors">support@nakoda.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
