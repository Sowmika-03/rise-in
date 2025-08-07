module payment_splitter::payment_splitter {
    use std::signer;
    use std::vector;
    use std::string::String;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Error codes
    const ENOTOWNER: u64 = 1;
    const EINVALID_PERCENTAGES: u64 = 2;
    const EINVALID_SPLIT_ID: u64 = 3;
    const EEMPTY_RECIPIENTS: u64 = 4;
    const ELENGTH_MISMATCH: u64 = 5;

    /// Payment split structure - now with copy and drop abilities
    struct PaymentSplit has store, copy, drop {
        id: u64,
        name: String,
        recipients: vector<address>,
        percentages: vector<u64>,
        total_amount: u64,
        created_at: u64,
        is_active: bool,
    }

    /// Global store for payment splits
    struct PaymentSplitterStore has key {
        splits: vector<PaymentSplit>,
        next_split_id: u64,
    }

    #[event]
    struct SplitCreatedEvent has drop, store {
        split_id: u64,
        creator: address,
        recipients: vector<address>,
        percentages: vector<u64>,
        timestamp: u64,
    }

    #[event]
    struct PaymentExecutedEvent has drop, store {
        split_id: u64,
        total_amount: u64,
        executor: address,
        timestamp: u64,
    }

    /// Initialize the payment splitter for an account
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        if (!exists<PaymentSplitterStore>(account_addr)) {
            move_to(account, PaymentSplitterStore {
                splits: vector::empty<PaymentSplit>(),
                next_split_id: 0,
            });
        };
    }

    /// Create a new payment split
    public entry fun create_split(
        account: &signer,
        name: String,
        recipients: vector<address>,
        percentages: vector<u64>,
    ) acquires PaymentSplitterStore {
        let account_addr = signer::address_of(account);
        
        // Ensure store exists
        if (!exists<PaymentSplitterStore>(account_addr)) {
            initialize(account);
        };
        
        let store = borrow_global_mut<PaymentSplitterStore>(account_addr);
        
        // Validation
        assert!(!vector::is_empty(&recipients), EEMPTY_RECIPIENTS);
        assert!(vector::length(&recipients) == vector::length(&percentages), ELENGTH_MISMATCH);
        
        let total_percentage = 0u64;
        let i = 0;
        while (i < vector::length(&percentages)) {
            total_percentage = total_percentage + *vector::borrow(&percentages, i);
            i = i + 1;
        };
        assert!(total_percentage == 100, EINVALID_PERCENTAGES);

        let split_id = store.next_split_id;
        let new_split = PaymentSplit {
            id: split_id,
            name,
            recipients,
            percentages,
            total_amount: 0,
            created_at: timestamp::now_seconds(),
            is_active: true,
        };

        vector::push_back(&mut store.splits, new_split);
        store.next_split_id = split_id + 1;

        // Emit event - create copies for the event
        let recipients_copy = *&new_split.recipients;
        let percentages_copy = *&new_split.percentages;
        
        event::emit(SplitCreatedEvent {
            split_id,
            creator: account_addr,
            recipients: recipients_copy,
            percentages: percentages_copy,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Execute payment split
    public entry fun execute_split(
        account: &signer,
        split_id: u64,
        amount: u64,
    ) acquires PaymentSplitterStore {
        let account_addr = signer::address_of(account);
        let store = borrow_global_mut<PaymentSplitterStore>(account_addr);
        
        // Find and validate split
        assert!(split_id < vector::length(&store.splits), EINVALID_SPLIT_ID);
        let split = vector::borrow_mut(&mut store.splits, split_id);
        assert!(split.is_active, EINVALID_SPLIT_ID);

        // Update total amount
        split.total_amount = split.total_amount + amount;

        // Transfer coins to recipients
        let i = 0;
        while (i < vector::length(&split.recipients)) {
            let recipient = *vector::borrow(&split.recipients, i);
            let percentage = *vector::borrow(&split.percentages, i);
            let recipient_amount = (amount * percentage) / 100;
            
            if (recipient_amount > 0) {
                coin::transfer<AptosCoin>(account, recipient, recipient_amount);
            };
            i = i + 1;
        };

        // Emit event
        event::emit(PaymentExecutedEvent {
            split_id,
            total_amount: amount,
            executor: account_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Get split details
    #[view]
    public fun get_split(owner: address, split_id: u64): PaymentSplit acquires PaymentSplitterStore {
        let store = borrow_global<PaymentSplitterStore>(owner);
        assert!(split_id < vector::length(&store.splits), EINVALID_SPLIT_ID);
        *vector::borrow(&store.splits, split_id)
    }

    /// Get total number of splits
    #[view] 
    public fun get_splits_count(owner: address): u64 acquires PaymentSplitterStore {
        if (!exists<PaymentSplitterStore>(owner)) {
            return 0
        };
        let store = borrow_global<PaymentSplitterStore>(owner);
        vector::length(&store.splits)
    }

    /// Get all splits for an owner
    #[view]
    public fun get_all_splits(owner: address): vector<PaymentSplit> acquires PaymentSplitterStore {
        if (!exists<PaymentSplitterStore>(owner)) {
            return vector::empty<PaymentSplit>()
        };
        let store = borrow_global<PaymentSplitterStore>(owner);
        store.splits
    }
}