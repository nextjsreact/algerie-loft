import { createClient } from '@supabase/supabase-js';
import { differenceInDays } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and service role key are required.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateBillingAlerts() {
  const { data: lofts, error } = await supabase.from('lofts').select('*');

  if (error) {
    console.error('Error fetching lofts:', error);
    return;
  }

  for (const loft of lofts) {
    const today = new Date();
    const utilities = [
      'eau',
      'electricite',
      'gaz',
      'telephone',
      'internet',
    ];

    for (const utility of utilities) {
      const nextDueDate = loft[`prochaine_echeance_${utility}`];

      if (nextDueDate) {
        const daysUntilDue = differenceInDays(new Date(nextDueDate), today);

        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: loft.owner_id,
              title: `Upcoming Bill for ${loft.name}`,
              message: `The ${utility} bill is due in ${daysUntilDue} days.`,
              link: `/lofts/${loft.id}/edit`,
            });

          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          }
        }
      }
    }
  }
}

generateBillingAlerts();
