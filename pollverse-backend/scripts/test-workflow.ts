async function testWorkflow() {
    const API_BASE = 'http://localhost:3000';
    console.log('🚀 Starting Validation Workflow Test...');

    try {
        console.log('\nStep 1: Creating a PENDING poll...');
        const pollResponse = await fetch(`${API_BASE}/polls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: "Test SLA Escalation " + Date.now(),
                creatorId: 2,
                status: 'PENDING',
                pollType: 'multiple_choice',
                options: [{ id: 1, text: 'Option A' }, { id: 2, text: 'Option B' }],
                category: 'Technology'
            })
        });
        const poll = await pollResponse.json();
        console.log(`✅ Poll Created: ID ${poll.id}, Deadline: ${poll.moderationDeadline}`);

        console.log('\nStep 2: [MANUAL/SQL] To test SLA, run this SQL:');
        console.log(`UPDATE poll SET "moderationDeadline" = NOW() - INTERVAL '1 hour', "assignedModeratorId" = 1 WHERE id = ${poll.id};`);

        console.log('\nStep 3: Testing Weightage...');
        const configRes = await fetch(`${API_BASE}/polls/config`);
        const config = await configRes.json();
        console.log('Current Boost Factor for Paid:', config.paidPollBoostFactor);

        console.log('\nStep 4: Creating a Paid Poll...');
        const paidPollRes = await fetch(`${API_BASE}/polls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: "Paid Poll Boost Test " + Date.now(),
                creatorId: 1,
                status: 'PUBLISHED',
                isPaid: true,
                pollType: 'binary',
                options: [{ id: 'a', text: 'Yes' }, { id: 'b', text: 'No' }],
                category: 'For You'
            })
        });
        const paidPoll = await paidPollRes.json();
        console.log(`✅ Paid Poll Created: ID ${paidPoll.id}`);

        console.log('\nStep 5: Checking Trending Feed...');
        const trendingRes = await fetch(`${API_BASE}/polls?category=Trending`);
        const trending = await trendingRes.json();
        const isPaidFirst = trending[0].id === paidPoll.id;
        console.log(`Paid Poll is first in Trending? ${isPaidFirst ? '✅ Yes' : '❌ No (Needs more likes/boost)'}`);

        console.log('\nWorkflow Test Script Ready.');
    } catch (error: any) {
        console.error('❌ Test Failed:', error.message);
    }
}

testWorkflow();
