import { getInquiries } from '@/actions/inquiry.actions'
import { DeleteInquiryButton } from '@/components/admin/DeleteInquiryButton'

export const dynamic = 'force-dynamic'

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Inquiries</h1>
        <p className="text-muted-foreground mt-1">Review messages sent by customers from the storefront.</p>
      </div>

      <div className="bg-background border border-border shadow-sm rounded-lg overflow-hidden">
        <ul className="divide-y divide-border">
          {inquiries.length > 0 ? (
            inquiries.map((inquiry) => (
              <li key={inquiry.id} className="p-6 hover:bg-secondary/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {inquiry.customer_name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>📱 {inquiry.phone_number}</span>
                      {inquiry.email && <span>✉️ {inquiry.email}</span>}
                      {inquiry.product_id && (
                        <span className="text-primary-dark">
                          Interested in: {inquiry.products?.name || 'Unknown Product'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(inquiry.created_at).toLocaleString()}
                    </span>
                    <DeleteInquiryButton id={inquiry.id} />
                  </div>
                </div>
                <div className="mt-4 text-sm text-foreground bg-secondary/50 p-4 rounded-md border border-border">
                  {inquiry.message}
                </div>
              </li>
            ))
          ) : (
            <li className="p-12 text-center text-sm text-muted-foreground">
              No inquiries found.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
