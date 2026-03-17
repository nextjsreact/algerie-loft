import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { getTasks, getTasksWithLoftInfo } from "@/app/actions/tasks";
import { createClient } from "@/utils/supabase/server";
import { taskSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeLoftDetails = searchParams.get('includeLoftDetails') === 'true';

    const tasks = includeLoftDetails ? await getTasksWithLoftInfo() : await getTasks();

    return NextResponse.json({ 
      tasks: tasks || [],
      total: tasks?.length || 0
    });
  } catch (error) {
    console.error("Erreur API tasks GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthAPI();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    // Use service role for all DB operations
    const supabase = await createClient(true);

    // Validate loft_id if provided
    if (validatedData.loft_id) {
      const { data: loft, error: loftError } = await supabase
        .from("lofts")
        .select("id")
        .eq("id", validatedData.loft_id)
        .single();

      if (loftError || !loft) {
        return NextResponse.json({ error: "Loft invalide" }, { status: 400 });
      }
    }

    // Create the task
    const { data: newTask, error } = await supabase
      .from("tasks")
      .insert({
        ...validatedData,
        due_date: validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json({ error: "Erreur création tâche" }, { status: 500 });
    }

    // Send notification to assigned user (if different from creator)
    if (validatedData.assigned_to && validatedData.assigned_to !== session.user.id) {
      try {
        // Get loft name if available
        let loftName: string | undefined;
        if (validatedData.loft_id) {
          const { data: loft } = await supabase
            .from('lofts')
            .select('name')
            .eq('id', validatedData.loft_id)
            .single();
          loftName = loft?.name;
        }

        const dueDateText = validatedData.due_date
          ? new Date(validatedData.due_date).toLocaleDateString('fr-FR')
          : '';

        const assignedBy = session.user.full_name || 'Manager';
        const titleText = `Nouvelle tâche assignée`;
        const messageText = dueDateText
          ? `"${validatedData.title}" vous a été assignée par ${assignedBy}${loftName ? ` (${loftName})` : ''}. Échéance: ${dueDateText}`
          : `"${validatedData.title}" vous a été assignée par ${assignedBy}${loftName ? ` (${loftName})` : ''}`;

        // Insert notification directly with service role — no Server Action chain
        console.log('📬 Inserting notification for user:', validatedData.assigned_to, { titleText, messageText });
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: validatedData.assigned_to,
            title: titleText,
            message: messageText,
            title_key: 'newTaskAssigned',
            message_key: 'newTaskAssignedMessage',
            type: 'info',
            link: `/tasks/${newTask.id}`,
            sender_id: session.user.id,
            is_read: false,
            created_at: new Date().toISOString(),
          })
          .select();

        if (notifError) {
          console.error('❌ Notification insert error:', JSON.stringify(notifError));
          // Don't fail the request — task was created successfully
        } else {
          console.log('✅ Task assignment notification sent to:', validatedData.assigned_to, notifData);
        }
      } catch (notifErr) {
        console.error('Failed to send notification:', notifErr);
      }
    }

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur API tasks POST:", error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
