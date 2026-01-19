<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait RecordsActivity
{
    /**
     * Boot the trait.
     */
    protected static function bootRecordsActivity()
    {
        foreach (static::getActivitiesToRecord() as $event) {
            static::$event(function (Model $model) use ($event) {
                $model->recordActivity($event);
            });
        }
    }

    /**
     * Activities to record.
     *
     * @return array
     */
    protected static function getActivitiesToRecord()
    {
        return ['created', 'updated', 'deleted'];
    }

    /**
     * Record activity.
     *
     * @param string $event
     * @return void
     */
    protected function recordActivity($event)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'subject_type' => get_class($this),
            'subject_id' => $this->id,
            'action' => $event,
            'description' => "{$event} " . class_basename($this),
            'properties' => $this->activityProperties($event),
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * Get properties to log.
     *
     * @param string $event
     * @return array|null
     */
    protected function activityProperties($event)
    {
        if ($event === 'updated') {
            return [
                'old' => $this->getOriginal(),
                'attributes' => $this->getAttributes(), // or just getDirty()
                'changed' => $this->getChanges(),
            ];
        }

        return null;
    }
}
